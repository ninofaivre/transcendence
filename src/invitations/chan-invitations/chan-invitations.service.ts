import { subject } from '@casl/ability';
import { ForbiddenException, Inject, Injectable, InternalServerErrorException, NotFoundException, forwardRef } from '@nestjs/common';
import { Prisma, ChanInvitationStatus, ChanInvitationDmDiscussionEvent, ClassicChanEventType } from '@prisma/client';
import { NestRequestShapes, nestControllerContract } from '@ts-rest/nest';
import contract from 'contract/contract';
import { zChanInvitationReturn } from 'contract/routers/invitations';
import { zInvitationFilterType } from 'contract/zod/inv.zod';
import { PrismaService } from 'nestjs-prisma';
import { Action, CaslAbilityFactory } from 'src/casl/casl-ability.factory/casl-ability.factory';
import { ChansService } from 'src/chans/chans.service';
import { DmsService } from 'src/dms/dms.service';
import { SseService } from 'src/sse/sse.service';
import { UserService } from 'src/user/user.service';
import { z } from 'zod';

const c = nestControllerContract(contract.invitations.chan)
type RequestShapes = NestRequestShapes<typeof c>

@Injectable()
export class ChanInvitationsService
{

	constructor(private readonly usersService: UserService,
			    private readonly prisma: PrismaService,
			    private readonly casl: CaslAbilityFactory,
			    private readonly dmsService: DmsService,
			    private readonly sse: SseService,
				@Inject(forwardRef(() => ChansService))
			    private readonly chansService: ChansService) {}

	private chanInvitationSelect =
	{
		id: true,
		chanId: true,
		chanTitle: true,
		status: true,
		invitedUserName: true,
		invitingUserName: true,
	} satisfies Prisma.ChanInvitationSelect

	private chanInvitationGetPayload =
	{
		select: this.chanInvitationSelect
	} satisfies Prisma.ChanInvitationArgs

	private getChanInvitationArgViaUser(status: ChanInvitationStatus[])
	{
		const arg =
		{
			where: { status: { in: status } },
			select: this.chanInvitationSelect,
			orderBy: { creationDate: 'asc' }
		} satisfies Prisma.ChanInvitationFindManyArgs
		return arg
	}

	formatChanInvitation(chanInvitation: Prisma.ChanInvitationGetPayload<typeof this.chanInvitationGetPayload>)
	: z.infer<typeof zChanInvitationReturn>
	{
		return chanInvitation
	}

	formatChanInvitationArray(chanInvitationsArray: Prisma.ChanInvitationGetPayload<typeof this.chanInvitationGetPayload>[])
	{
		return chanInvitationsArray.map(inv => this.formatChanInvitation(inv))
	}

	async getChanInvitations(username: string, status: ChanInvitationStatus[])
	{
		const res = await this.usersService.getUserByNameOrThrow(username,
			{
				incomingChanInvitation: this.getChanInvitationArgViaUser(status),
				outcomingChanInvitation: this.getChanInvitationArgViaUser(status)
			})
		const chanInvitations =
		{
			incoming: this.formatChanInvitationArray(res.incomingChanInvitation),
			outcoming: this.formatChanInvitationArray(res.outcomingChanInvitation)
		}
		return chanInvitations
	}

	private async getChanInvitationOrThrow<T extends Prisma.ChanInvitationSelect>(username: string, id: string, type: 'INCOMING' | 'OUTCOMING' | 'ANY', select: Prisma.SelectSubset<T, Prisma.ChanInvitationSelect>)
	{
		let or: Prisma.Enumerable<Prisma.ChanInvitationWhereInput> = []
		if (type === 'INCOMING' || type === 'ANY')
			or.push({ invitedUserName: username })
		if (type === 'OUTCOMING' || type === 'ANY')
			or.push({ invitingUserName: username })
		const res = await this.prisma.chanInvitation.findUnique({
			where: { id: id, OR: or },
			select: select })
		if (!res)
			throw new NotFoundException(`not found chan invitation ${id}`)
		return res
	}

	async getChanInvitationById(username: string, id: string)
	{
		return this.formatChanInvitation(await this.getChanInvitationOrThrow(username, id, 'ANY', this.chanInvitationSelect))
	}

	async getChanInvitationsByType(username: string, type: zInvitationFilterType, status: ChanInvitationStatus[])
	{
		if (type === 'INCOMING')
		{
			return this.formatChanInvitationArray((await this.usersService.getUserByNameOrThrow(username,
				{
					incomingChanInvitation: this.getChanInvitationArgViaUser(status),
				})).incomingChanInvitation)
		}
		return this.formatChanInvitationArray((await this.usersService.getUserByNameOrThrow(username,
			{
				outcomingChanInvitation: this.getChanInvitationArgViaUser(status),
			})).outcomingChanInvitation)
	}

	async createChanInvitation(invitingUserName: string, invitedUserName: string, chanId: string)
	{
		await Promise.all
		([
			this.usersService.getUserByNameOrThrow(invitedUserName, { name: true }),
			this.casl.checkAbilitiesForUserInChan(invitingUserName, chanId, [{ action: Action.Create, subject: subject('ChanInvitation', { invitedUserName: invitedUserName }) }]),
			this.casl.checkAbilitiesForUser(invitingUserName, [{ action: Action.Create, subject: subject('ChanInvitation', { invitedUserName: invitedUserName }) }]),
		])
		const directMessageId = (await this.dmsService.findDmBetweenUsers(invitedUserName, invitingUserName, { id: true }))?.id
		if (!directMessageId)
			throw new ForbiddenException("no dm with user")
		const { chanInv, dmEvent } = await this.prisma.$transaction(async (tx) =>
			{
				const chanInv = this.formatChanInvitation(await tx.chanInvitation.create({
					data:
					{
						chan: { connect: { id: chanId } },
						invitingUser: { connect: { name: invitingUserName } },
						invitedUser: { connect: { name: invitedUserName } },
					},
					select: this.chanInvitationSelect }))
				const dmEvent = await this.dmsService.createChanInvitationDmEvent(directMessageId, invitingUserName, chanInv.id, tx)
				
				// const dmEvent = await this.dmsService.findOneDmElement(chanInv.eventId, tx)
				return { chanInv, dmEvent }
			})
		// to notify the dmEvent after the invitation (probably easier to render the event in this order for the front)
		// TODO: type setTimeout extra args (mb I'm not using the right setTimeout)
		setTimeout(this.sse.pushEventMultipleUser.bind(this.sse), 0, [invitingUserName, invitedUserName], { type: 'CREATED_DM_EVENT', data: { dmId: directMessageId, element: dmEvent } })
		return chanInv
	}

	public async updateAndNotifyManyInvs(newStatus: ChanInvitationStatus, invsId: string[])
	{
		await this.prisma.chanInvitation.updateMany({ where: { id: { in: invsId } },
			data:
			{
				status: newStatus
			} })
		const res = this.formatChanInvitationArray(await this.prisma.chanInvitation.findMany({
			where: { id: { in: invsId } },
			select: this.chanInvitationSelect }))
		return Promise.all(res.map(async el =>
			{ 
				return this.sse.pushEventMultipleUser([el.invitingUserName, el.invitedUserName], { type: 'UPDATED_CHAN_INVITATION', data: el })
			}))
	}

	async acceptAllChanInvitationsForUser(username: string, chanId: string, exceptionInvitationId?: string)
	{
		const invs = (await this.usersService.getUserByNameOrThrow(username,
			{
				incomingChanInvitation:
				{
					where:
					{
						status: ChanInvitationStatus.PENDING,
						chanId: chanId,
						...((!!exceptionInvitationId) ?
							{ id: { not: exceptionInvitationId } } : {})
					},
					select: { id: true }
				}
			})).incomingChanInvitation.map(el => el.id)
		await this.updateAndNotifyManyInvs(ChanInvitationStatus.ACCEPTED, invs)
	}

	async updateIncomingChanInvitation(username: string, newStatus: RequestShapes['updateIncomingChanInvitation']['body']['status'], id: string)
	{
		const chanInvitation = await this.getChanInvitationOrThrow(username, id, 'INCOMING', { status: true, chanId: true })
		await this.casl.checkAbilitiesForUser(username, [{ action: Action.Update, subject: subject('ChanInvitation', chanInvitation) }])
		if (newStatus === 'ACCEPTED')
		{
			await this.acceptAllChanInvitationsForUser(username, chanInvitation.chanId, id)
			const newChan = await this.chansService.pushUserToChanAndNotifyUsers(username, chanInvitation.chanId)

			await this.sse.pushEvent(username, { type: 'CREATED_CHAN', data: newChan })
		}
		return this.formatChanInvitation(await this.prisma.chanInvitation.update({
			where: { id: id },
			data: { status: newStatus },
			select: this.chanInvitationSelect }))
	}

	async updateOutcomingChanInvitation(username: string, newStatus: RequestShapes['updateOutcomingChanInvitation']['body']['status'], id: string)
	{
		const chanInvitation = await this.getChanInvitationOrThrow(username, id, 'OUTCOMING', { status: true, invitedUserName: true, invitingUserName: true })
		await this.casl.checkAbilitiesForUser(username, [{ action: Action.Update, subject: subject('ChanInvitation', chanInvitation) }])
		return this.formatChanInvitation(await this.prisma.chanInvitation.update({
			where: { id: id },
			data: { status: newStatus },
			select: this.chanInvitationSelect }))
	}
}
