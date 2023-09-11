import {
	ForbiddenException,
	Inject,
	Injectable,
	NotFoundException,
	forwardRef,
} from "@nestjs/common"
import { Prisma, ChanInvitationStatus, PermissionList } from "@prisma/client"
import { zChanInvitationStatus } from "contract"
import { contractErrors, isContractError } from "contract"
import { zChanInvitationReturn } from "contract"
import { ChansService } from "src/chans/chans.service"
import { DmsService } from "src/dms/dms.service"
import { PrismaService } from "src/prisma/prisma.service"
import { SseService } from "src/sse/sse.service"
import { EnrichedRequest } from "src/types"
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
        invitedUser: { select: { displayName: true } },
		invitingUserName: true,
        invitingUser: { select: { displayName: true } }
	} satisfies Prisma.ChanInvitationSelect

	private chanInvitationGetPayload = {
		select: this.chanInvitationSelect,
	} satisfies Prisma.ChanInvitationDefaultArgs

	private getChanInvitationArgViaUser(
		status: (typeof ChanInvitationStatus)[keyof typeof ChanInvitationStatus][],
	) {
		const arg = {
			where: { status: { in: status } },
			select: this.chanInvitationSelect,
			orderBy: { creationDate: "desc" },
		} satisfies Prisma.ChanInvitationFindManyArgs
		return arg
	}

	formatChanInvitation(
		chanInvitation: Prisma.ChanInvitationGetPayload<typeof this.chanInvitationGetPayload>,
	): z.infer<typeof zChanInvitationReturn> {
        const { invitedUser: { displayName: invitedDisplayName }, invitingUser: { displayName: invitingDisplayName }, ...rest } = chanInvitation
		return {
            ...rest,
            invitedDisplayName,
            invitingDisplayName
        }
	}

	formatChanInvitationArray(
		chanInvitationsArray: Prisma.ChanInvitationGetPayload<
			typeof this.chanInvitationGetPayload
		>[],
	) {
		return chanInvitationsArray.map((inv) => this.formatChanInvitation(inv))
	}

	async getChanInvitations(
		username: string,
		status: (typeof ChanInvitationStatus)[keyof typeof ChanInvitationStatus][],
	) {
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

	async createChanInvitation(reqUser: EnrichedRequest['user'], invitedUserName: string, chanId: string) {
        const { username: invitingUserName } = reqUser
		if (invitingUserName === invitedUserName)
			return contractErrors.ForbiddenSelfOperation('create chan invitation')
		const invitedUser = await this.usersService.getUserByNameOrThrow(invitedUserName, {
            name: true,
            blockedByUser: { where: { blockingUserName: invitingUserName } },
            blockedUser: { where: { blockingUserName: invitingUserName } }
        })
        if (invitedUser.blockedUser.length || invitedUser.blockedByUser.length)
            throw new ForbiddenException("can't invited blocked or blocked by users")
		const directMessageId = (
			await this.dmsService.findDmBetweenUsers(invitedUserName, invitingUserName, {
				id: true,
			})
		)?.id
		if (!directMessageId) throw new ForbiddenException("no dm with user")
        const chan = await this.chansService.getChan({ id: chanId },
            {
                ...this.chansService.getSelfPermSelect(invitingUserName, invitedUserName),
				users: { where: { name: invitedUserName }, select: { name: true } },
            })
        if (!chan)
            return contractErrors.NotFoundChan(chanId)
        if (!this.chansService.doesUserHasSelfPermInChan(invitingUserName,'INVITE', chan))
            return contractErrors.ChanPermissionTooLow(invitingUserName, chanId, 'INVITE')
        const { users } = chan
		if (users.some(({ name }) => name === invitedUserName))
			throw new ForbiddenException(`${invitedUserName} already in chan ${chanId}`)
        const timedStatusUser = chan.timedStatusUsers.find(({ timedUserName, type }) =>
            timedUserName === invitedUserName && type === 'BAN')
        if (timedStatusUser)
            return contractErrors.UserBannedFromChan(invitedUserName, chanId, timedStatusUser.untilDate)
        const chanInv = this.formatChanInvitation(
            await this.prisma.chanInvitation.create({
                data: {
                    chan: { connect: { id: chanId } },
                    invitingUser: { connect: { name: invitingUserName } },
                    invitedUser: { connect: { name: invitedUserName } },
                },
                select: this.chanInvitationSelect,
            }),
        )
        await this.dmsService.createAndNotifyChanInvitationDmEvent(
            directMessageId,
            chanInv.id
        )
		await this.sse.pushEventMultipleUser([invitedUserName, invitingUserName], {
			type: "CREATED_CHAN_INVITATION",
			data: chanInv,
		}, reqUser)
		return chanInv
	}

	public async updateAndNotifyManyInvsStatus(
		status: z.infer<typeof zChanInvitationStatus>,
        where: Prisma.ChanInvitationWhereInput
    ) {
        const invs = await this.prisma.chanInvitation.findMany({
            where: {
                ...where,
                status: 'PENDING'
            },
            select: {
                invitedUserName: true,
                invitingUserName: true,
                id: true
            }})
        await this.prisma.chanInvitation.updateMany({
            where: { id: { in: invs.map(el => el.id) } },
            data: { status }
        })
		return Promise.all(
			invs.map(async (el) => 
				 this.sse.pushEventMultipleUser([el.invitingUserName, el.invitedUserName], {
					type: "UPDATED_CHAN_INVITATION_STATUS",
					data: { chanInvitationId: el.id, status },
				})
			),
		)
    }

	async updateChanInvitation(
        reqUser: EnrichedRequest['user'],
		newStatus: (typeof ChanInvitationStatus)[keyof typeof ChanInvitationStatus],
		id: string,
	) {
        const { username } = reqUser
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
			await this.updateAndNotifyManyInvsStatus('ACCEPTED',
                { chanId, invitedUserName: username, id: { not: id } })
			const newChan = await this.chansService.pushUserToChanAndNotifyUsers(username, chanId)
            if (isContractError(newChan))
                return newChan
			await this.sse.pushEvent(username, { type: "CREATED_CHAN", data: newChan })
		}
		const updatedChanInvitation = this.formatChanInvitation(
			await this.prisma.chanInvitation.update({
				where: { id },
				data: { status: newStatus },
				select: this.chanInvitationSelect,
			}),
		)
		await this.sse.pushEventMultipleUser([invitingUserName, invitedUserName], {
				type: "UPDATED_CHAN_INVITATION_STATUS",
				data: { chanInvitationId: id, status: newStatus },
			}, reqUser)
		return updatedChanInvitation
	}
}
