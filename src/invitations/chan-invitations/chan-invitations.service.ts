import { subject } from '@casl/ability';
import { ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Prisma, ChanInvitationStatus, ChanInvitationDmDiscussionEvent } from '@prisma/client';
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
			    private readonly chansService: ChansService) {}

	private chanInvitationSelect =
	{
		id: true,
		chanId: true,
		chanTitle: true,
		status: true,
		invitedUserName: true,
		invitingUserName: true,
		discussionEvent:
		{
			select:
			{
				dmDiscussionEvent:
				{
					select:
					{
						discussionElement:
						{
							select:
							{
								id: true,
								directMessageId: true
							}
						}
					}
				},
			}
		},
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
		const { discussionEvent, ...rest } = chanInvitation

		const dmId = discussionEvent.dmDiscussionEvent?.discussionElement?.directMessageId
		const eventId = discussionEvent.dmDiscussionEvent?.discussionElement?.id
		if (!dmId || !eventId)
			throw new InternalServerErrorException('a chan invitation failed to be linked to an event')

		const formattedChanInvitation =
		{
			...rest,
			dmId,
			eventId
		}
		return formattedChanInvitation
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
		return this.prisma.$transaction(async (tx) =>
		{
			const dmEventId = await this.dmsService.createChanInvitationDmEvent(directMessageId, invitingUserName, tx)
			const chanInv = this.formatChanInvitation(await tx.chanInvitation.create({
				data:
				{
					chan: { connect: { id: chanId } },
					discussionEvent: { connect: { id: dmEventId } },
					invitingUser: { connect: { name: invitingUserName } },
					invitedUser: { connect: { name: invitedUserName } },
				},
				select: this.chanInvitationSelect }))
			// to notify the dmEvent after the invitation (probably easier to render the event in this order for the front)
			const dmEvent = await this.dmsService.findOneDmElement(chanInv.eventId, tx)
			setTimeout(this.sse.pushEventMultipleUser.bind(this.sse), 0, [invitingUserName, invitedUserName], { type: 'CREATED_DM_EVENT', data: dmEvent })
			return chanInv
		})
	}

	private async acceptAllChanInvitations(username: string, chanId: string, exceptionInvitationId?: string)
	{
		const invs = (await this.usersService.getUserByNameOrThrow(username,
			{
				incomingChanInvitation:
				{
					where: { status: ChanInvitationStatus.PENDING, chanId: chanId },
					select: { id: true }
				}
			})).incomingChanInvitation.map(el => el.id)
		await this.prisma.chanInvitation.updateMany({ where: { id: { in: invs } },
			data:
			{
				status: ChanInvitationStatus.ACCEPTED
			} })
		const res = this.formatChanInvitationArray(await this.prisma.chanInvitation.findMany({
			where: { id: { in: invs } },
			select: this.chanInvitationSelect }))
		return Promise.all(res.map(async el =>
			{ 
				const usersToNotify = [el.invitingUserName]
				if (exceptionInvitationId && el.id !== exceptionInvitationId)
					usersToNotify.push(el.invitedUserName)
				return this.sse.pushEventMultipleUser(usersToNotify, { type: 'UPDATED_CHAN_INVITATION', data: el })
			}))
	}

	async updateIncomingChanInvitation(username: string, newStatus: RequestShapes['updateIncomingChanInvitation']['body']['status'], id: string)
	{
		const chanInvitation = await this.getChanInvitationOrThrow(username, id, 'INCOMING', { status: true, chanId: true })
		await this.casl.checkAbilitiesForUser(username, [{ action: Action.Update, subject: subject('ChanInvitation', chanInvitation) }])
		if (newStatus === 'ACCEPTED')
		{
			const newChan = await this.chansService.pushUserToChan(username, chanInvitation.chanId)
			await this.acceptAllChanInvitations(username, chanInvitation.chanId, id)
			await this.sse.pushEvent(username, { type: 'CREATED_CHAN', data: newChan })
			await this.sse.pushEventMultipleUser(newChan.users.filter(el => el !== username), { type: 'UPDATED_CHAN', data: newChan })
			// await this.chansService.welcomeUser(username, chanId)
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
