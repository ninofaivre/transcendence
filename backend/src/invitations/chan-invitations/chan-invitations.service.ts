import {
	ForbiddenException,
	Inject,
	Injectable,
	NotFoundException,
	forwardRef,
} from "@nestjs/common"
import { Prisma, ChanInvitationStatus, PermissionList } from "prisma-generated"
import { zChanInvitationReturn } from "contract"
import { ChansService } from "src/chans/chans.service"
import { DmsService } from "src/dms/dms.service"
import { PrismaService } from "src/prisma/prisma.service"
import { SseService } from "src/sse/sse.service"
import { UserService } from "src/user/user.service"
import { z } from "zod"

@Injectable()
export class ChanInvitationsService {
	constructor(
		@Inject(forwardRef(() => UserService))
		private readonly usersService: UserService,
		private readonly prisma: PrismaService,
		private readonly dmsService: DmsService,
		private readonly sse: SseService,
		@Inject(forwardRef(() => ChansService))
		private readonly chansService: ChansService,
	) {}

	private chanInvitationSelect = {
		id: true,
		chanId: true,
		chanTitle: true,
		status: true,
		invitedUserName: true,
		invitingUserName: true,
	} satisfies Prisma.ChanInvitationSelect

	private chanInvitationGetPayload = {
		select: this.chanInvitationSelect,
	} satisfies Prisma.ChanInvitationArgs

	private getChanInvitationArgViaUser(status: ChanInvitationStatus[]) {
		const arg = {
			where: { status: { in: status } },
			select: this.chanInvitationSelect,
			orderBy: { creationDate: "asc" },
		} satisfies Prisma.ChanInvitationFindManyArgs
		return arg
	}

	formatChanInvitation(
		chanInvitation: Prisma.ChanInvitationGetPayload<typeof this.chanInvitationGetPayload>,
	): z.infer<typeof zChanInvitationReturn> {
		return chanInvitation
	}

	formatChanInvitationArray(
		chanInvitationsArray: Prisma.ChanInvitationGetPayload<
			typeof this.chanInvitationGetPayload
		>[],
	) {
		return chanInvitationsArray.map((inv) => this.formatChanInvitation(inv))
	}

	async getChanInvitations(username: string, status: ChanInvitationStatus[]) {
		const res = await this.usersService.getUserByNameOrThrow(username, {
			incomingChanInvitation: this.getChanInvitationArgViaUser(status),
			outcomingChanInvitation: this.getChanInvitationArgViaUser(status),
		})
		const chanInvitations = {
			incoming: this.formatChanInvitationArray(res.incomingChanInvitation),
			outcoming: this.formatChanInvitationArray(res.outcomingChanInvitation),
		}
		return chanInvitations
	}

	private async getChanInvitationOrThrow<T extends Prisma.ChanInvitationSelect>(
		username: string,
		id: string,
		type: "INCOMING" | "OUTCOMING" | "ANY",
		select: Prisma.SelectSubset<T, Prisma.ChanInvitationSelect>,
	) {
		let or: Prisma.Enumerable<Prisma.ChanInvitationWhereInput> = []
		if (type === "INCOMING" || type === "ANY") or.push({ invitedUserName: username })
		if (type === "OUTCOMING" || type === "ANY") or.push({ invitingUserName: username })
		const res = await this.prisma.chanInvitation.findUnique({
			where: { id: id, OR: or },
			select: select,
		})
		if (!res) throw new NotFoundException(`not found chan invitation ${id}`)
		return res
	}

	async getChanInvitationById(username: string, id: string) {
		return this.formatChanInvitation(
			await this.getChanInvitationOrThrow(username, id, "ANY", this.chanInvitationSelect),
		)
	}

	async createChanInvitation(invitingUserName: string, invitedUserName: string, chanId: string) {
		if (invitingUserName === invitedUserName)
			throw new ForbiddenException(`self chan invitation`)
		await this.usersService.getUserByNameOrThrow(invitedUserName, { name: true })
		const directMessageId = (
			await this.dmsService.findDmBetweenUsers(invitedUserName, invitingUserName, {
				id: true,
			})
		)?.id
		if (!directMessageId) throw new ForbiddenException("no dm with user")
		await this.chansService.throwIfUserNotAuthorizedInChan(
			invitingUserName,
			chanId,
			PermissionList.INVITE,
		)
		const { users } = await this.chansService.getChanOrThrow(
			{ id: chanId },
			{
				users: { where: { name: invitedUserName }, select: { name: true } },
			},
		)
		if (users.length)
			throw new ForbiddenException(`${invitedUserName} already in chan ${chanId}`)
		// TODO: check if user is ban when ban user in chan added to schema
		const { chanInv, dmEvent } = await this.prisma.$transaction(async (tx) => {
			const chanInv = this.formatChanInvitation(
				await tx.chanInvitation.create({
					data: {
						chan: { connect: { id: chanId } },
						invitingUser: { connect: { name: invitingUserName } },
						invitedUser: { connect: { name: invitedUserName } },
					},
					select: this.chanInvitationSelect,
				}),
			)
			const dmEvent = await this.dmsService.createChanInvitationDmEvent(
				directMessageId,
				chanInv.id,
				tx,
			)
			return { chanInv, dmEvent }
		})
		await this.dmsService.formatAntNotifyDmElement(
			invitingUserName,
			invitedUserName,
			directMessageId,
			dmEvent,
		)
		await this.sse.pushEvent(invitedUserName, {
			type: "CREATED_CHAN_INVITATION",
			data: chanInv,
		})
		return chanInv
	}

	public async updateAndNotifyManyInvs(newStatus: ChanInvitationStatus, invsId: string[]) {
		await this.prisma.chanInvitation.updateMany({
			where: { id: { in: invsId } },
			data: {
				status: newStatus,
			},
		})
		const res = this.formatChanInvitationArray(
			await this.prisma.chanInvitation.findMany({
				where: { id: { in: invsId } },
				select: this.chanInvitationSelect,
			}),
		)
		return Promise.all(
			res.map(async (el) => {
				return this.sse.pushEventMultipleUser([el.invitingUserName, el.invitedUserName], {
					type: "UPDATED_CHAN_INVITATION",
					data: el,
				})
			}),
		)
	}

	async acceptAllChanInvitationsForUser(
		username: string,
		chanId: string,
		exceptionInvitationId?: string,
	) {
		const invs = (
			await this.usersService.getUserByNameOrThrow(username, {
				incomingChanInvitation: {
					where: {
						status: ChanInvitationStatus.PENDING,
						chanId: chanId,
						...(!!exceptionInvitationId ? { id: { not: exceptionInvitationId } } : {}),
					},
					select: { id: true },
				},
			})
		).incomingChanInvitation.map((el) => el.id)
		await this.updateAndNotifyManyInvs(ChanInvitationStatus.ACCEPTED, invs)
	}

	async updateChanInvitation(username: string, newStatus: ChanInvitationStatus, id: string) {
		const {
			status: oldStatus,
			chanId,
			invitedUserName,
			invitingUserName,
		} = await this.getChanInvitationOrThrow(username, id, "INCOMING", {
			status: true,
			chanId: true,
			invitingUserName: true,
			invitedUserName: true,
		})
		if (oldStatus !== ChanInvitationStatus.PENDING)
			throw new ForbiddenException(`can't update not PENDING chan invitation`)
		if (invitingUserName === username && newStatus === ChanInvitationStatus.ACCEPTED)
			throw new ForbiddenException(`can't accept OUTCOMING chan invitation`)
		if (invitingUserName === username && newStatus === ChanInvitationStatus.REFUSED)
			throw new ForbiddenException(`can't refuse OUTCOMING chan invitation`)
		if (invitedUserName === username && newStatus === ChanInvitationStatus.CANCELED)
			throw new ForbiddenException(`can't cancel incoming chan invitation`)
		if (newStatus === ChanInvitationStatus.ACCEPTED) {
			await this.acceptAllChanInvitationsForUser(username, chanId, id)
			const newChan = await this.chansService.pushUserToChanAndNotifyUsers(username, chanId)

			await this.sse.pushEvent(username, { type: "CREATED_CHAN", data: newChan })
		}
		const updatedChanInvitation = this.formatChanInvitation(
			await this.prisma.chanInvitation.update({
				where: { id },
				data: { status: newStatus },
				select: this.chanInvitationSelect,
			}),
		)
		await this.sse.pushEvent(
			invitingUserName !== username ? invitingUserName : invitedUserName,
			{ type: "UPDATED_CHAN_INVITATION", data: updatedChanInvitation },
		)
		return updatedChanInvitation
	}
}
