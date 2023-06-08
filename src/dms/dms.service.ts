import { ConflictException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ClassicDmEventType, DirectMessageStatus, Prisma } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { AppService } from 'src/app.service';
import { EventTypeList, SseService } from 'src/sse/sse.service';
import { z } from 'zod';
import { DmEvent, zDmDiscussionElementReturn, zDmDiscussionEventReturn, zDmReturn } from 'contract/routers/dms';
import { Tx } from 'src/types';
import { FriendEvent } from 'contract/routers/friends';
import { SseEvent } from 'contract/contract';


@Injectable()
export class DmsService
{
	constructor(private readonly prisma: PrismaService,
			    private readonly appService: AppService,
			    private readonly sse: SseService) {}


	private directMessageSelect =
	{
		id: true,

		requestedUserName: true,
		requestedUserStatus: true,
		requestedUserStatusMutedUntil: true,

		requestingUserName: true,
		requestingUserStatus: true,
		requestingUserStatusMutedUntil: true,
		creationDate: true,
		status: true,
	} satisfies Prisma.DirectMessageSelect

	private directMessageGetPayload =
	{
		select: this.directMessageSelect
	} satisfies Prisma.DirectMessageArgs
	
	private dmDiscussionEventSelect =
	{
		classicDmDiscussionEvent: { select: { eventType: true } },
		chanInvitationDmDiscussionEvent: { select: { chanInvitation: { select: { id: true } } } }
	} satisfies Prisma.DmDiscussionEventSelect
	
	private dmDiscussionEventGetPayload =
	{
		select: this.dmDiscussionEventSelect
	} satisfies Prisma.DmDiscussionEventArgs

	private dmDiscussionMessageSelect =
	{
		content: true,
		relatedTo: true
	} satisfies Prisma.DmDiscussionMessageSelect

	private dmDiscussionElementSelect =
	{
		id: true,
		author: true,
		creationDate: true,
		message: { select: this.dmDiscussionMessageSelect },
		event: { select: this.dmDiscussionEventSelect },
	} satisfies Prisma.DmDiscussionElementSelect

	private dmDiscussionElementGetPayload =
	{
		select: this.dmDiscussionElementSelect
	} satisfies Prisma.DmDiscussionElementArgs

	private formatDirectMessage(dm: Prisma.DirectMessageGetPayload<typeof this.directMessageGetPayload>, username: string)
	: z.infer<typeof zDmReturn>
	{
		const { requestedUserName, requestedUserStatus, requestedUserStatusMutedUntil, requestingUserName, requestingUserStatus, requestingUserStatusMutedUntil, ...rest } = dm
		
		const requested: boolean = (requestedUserName === username)
		const formattedDirectMessage =
		{
			...rest,
			friendName: requested ? requestingUserName : requestedUserName,
			myDmStatus: requested ? requestedUserStatus : requestingUserStatus,
			myDmMutedUntil : requested ? requestedUserStatusMutedUntil : requestingUserStatusMutedUntil
		}
		return formattedDirectMessage
	}

	private formatDirectMessageArray(dms: Prisma.DirectMessageGetPayload<typeof this.directMessageGetPayload>[], username: string)
	: z.infer<typeof zDmReturn>[]
	{
		return dms.map(dm => this.formatDirectMessage(dm, username))
	}

	private formatDmEvent(event: Prisma.DmDiscussionEventGetPayload<typeof this.dmDiscussionEventGetPayload>)
	: z.infer<typeof zDmDiscussionEventReturn>
	{
		type RetypedEvent = (Omit<typeof event, 'classicDmDiscussionEvent' | 'chanInvitationDmDiscussionEvent'> & { classicDmDiscussionEvent: Exclude<typeof event.classicDmDiscussionEvent, null>, chanInvitationDmDiscussionEvent: null }) |
		(Omit<typeof event, 'classicDmDiscussionEvent' | 'chanInvitationDmDiscussionEvent'> & { classicDmDiscussionEvent: null, chanInvitationDmDiscussionEvent: Exclude<typeof event.chanInvitationDmDiscussionEvent, null>})
		const retypedEvent = event as RetypedEvent

		const { chanInvitationDmDiscussionEvent, classicDmDiscussionEvent, ...rest } = retypedEvent
		
		if (chanInvitationDmDiscussionEvent)
		{
			if (!chanInvitationDmDiscussionEvent.chanInvitation?.id)
				throw new InternalServerErrorException('invalid dm discussion event')
			return { ...rest, eventType: 'CHAN_INVITATION',chanInvitationId: chanInvitationDmDiscussionEvent.chanInvitation.id }
		}
		else
			return { ...rest, ...classicDmDiscussionEvent }
	}

	private formatDmElement(element: Prisma.DmDiscussionElementGetPayload<typeof this.dmDiscussionElementGetPayload>)
	: z.infer<typeof zDmDiscussionElementReturn>
	{
		type RetypedElement = (Omit<typeof element, 'event' | 'message'> & { event: null, message: Exclude<typeof element.message, null> }) |
		(Omit<typeof element, 'event' | 'message'> & { event: Exclude<typeof element.event, null>, message: null })
		const { event, message, ...rest } = element as RetypedElement

		if (event)
			return { ...rest, type: 'event', event: this.formatDmEvent(event) }
		else
			return { ...rest, type: 'message', message }
	}

	private formatDmElementArray(elements: Prisma.DmDiscussionElementGetPayload<typeof this.dmDiscussionElementGetPayload>[])
	: z.infer<typeof zDmDiscussionElementReturn>[]
	{
		return elements.map(el => this.formatDmElement(el))
	}

	public async findDmBetweenUsers<T extends Prisma.DirectMessageSelect>(usernameA: string, usernameB: string, select: Prisma.Subset<T, Prisma.DirectMessageSelect>)
	{
		//findFirst instead of findUnique because there is no way to express in
		// a prisma schema than a relation is unique in both ways/direction
		return this.prisma.directMessage.findFirst({
			where:
			{
				OR:
				[
					{
						requestedUserName: usernameA,
						requestingUserName: usernameB
					},
					{
						requestingUserName: usernameA,
						requestedUserName: usernameB
					}
				]
			},
			select: select })
	}

	private getDmDiscussionEventCreateArgs(dmId: string, author: string)
	{
		const args =
		{
			data:
			{
				discussionElement:
				{
					create:
					{
						authorRelation:
						{
							connect: { name: author }
						},
						directMessage:
						{
							connect: { id: dmId }
						}
					}
				}
			},
			select: { discussionElement: { select: this.dmDiscussionElementSelect } } 
		} satisfies Prisma.DmDiscussionEventCreateArgs
		return args
	}

	public async createClassicDmEvent(dmId: string, eventType: ClassicDmEventType, author: string)
	{
		const { data, ...rest } = this.getDmDiscussionEventCreateArgs(dmId, author)
		const createArgs = { ...rest, data: { classicDmDiscussionEvent: { create: { eventType: eventType } }, ...data } } satisfies Prisma.DmDiscussionEventCreateArgs
		const newEvent = (await this.prisma.dmDiscussionEvent.create(createArgs)).discussionElement
		if (!newEvent?.event?.classicDmDiscussionEvent)
			throw new InternalServerErrorException('a discussion event has failed to be created')
		return this.formatDmElement(newEvent)
	}

	public async createChanInvitationDmEvent(dmId: string, author: string, chanId: string, prismaInstance: Tx = this.prisma)
	{
		const { data, ...rest } = this.getDmDiscussionEventCreateArgs(dmId, author)
		const createArgs = { ...rest, data: { chanInvitationDmDiscussionEvent: { create: { chanInvitationId: chanId } }, ...data } } satisfies Prisma.DmDiscussionEventCreateArgs
		const newEvent = (await prismaInstance.dmDiscussionEvent.create(createArgs)).discussionElement
		if (!newEvent?.event?.chanInvitationDmDiscussionEvent)
			throw new InternalServerErrorException('a discussion event has failed to be created')
		return this.formatDmElement(newEvent)
	}

	public async findOneDmElement(dmElementId: string, prismaInstance: Tx = this.prisma)
	{
		const dmDiscussionElement = await prismaInstance.dmDiscussionElement.findUnique({
			where: { id: dmElementId },
			select: this.dmDiscussionElementSelect })
		if (!dmDiscussionElement)
			throw new NotFoundException(`not found DmDiscussionElement ${dmElementId}`)
		return this.formatDmElement(dmDiscussionElement)
	}

	public async createAndNotifyDm(requestingUserName: string, requestedUserName: string)
	{
		const newDm = await this.prisma.directMessage.create({
				data:
				{
					requestingUserName: requestingUserName,
					requestedUserName: requestedUserName,
				},
				select: this.directMessageSelect })
		await this.sse.pushEvent(requestingUserName, { type: 'CREATED_DM', data: this.formatDirectMessage(newDm, requestingUserName) })
		await this.sse.pushEvent(requestedUserName, { type: 'CREATED_DM', data: this.formatDirectMessage(newDm, requestedUserName) })
		return newDm.id
	}

	public async updateAndNotifyDmStatus(dmId: string, newStatus: DirectMessageStatus, username: string)
	{
		const updatedDm = await this.prisma.directMessage.update({ where: { id: dmId },
			data:
			{
				status: newStatus
			},
			select: this.directMessageSelect })
		await Promise.all
		([
			this.sse.pushEvent(updatedDm.requestingUserName, { type: 'UPDATED_DM', data: this.formatDirectMessage(updatedDm, updatedDm.requestingUserName) }),
			this.sse.pushEvent(updatedDm.requestedUserName, { type: 'UPDATED_DM', data: this.formatDirectMessage(updatedDm, updatedDm.requestedUserName) })
		])
		const newEvent = await this.createClassicDmEvent(dmId, (newStatus === DirectMessageStatus.ENABLED) ? ClassicDmEventType.ENABLED_DM : ClassicDmEventType.DISABLED_DM, username)
		await this.sse.pushEventMultipleUser([updatedDm.requestedUserName, updatedDm.requestingUserName], { type: 'CREATED_DM_ELEMENT', data: { dmId: dmId, element: newEvent } })
	}

	async getDms(username: string)
	{
		const res = this.formatDirectMessageArray(await this.prisma.directMessage.findMany({
			where:
			{
				OR:
				[
					{ requestedUserName: username },
					{ requestingUserName: username }
				],
			},
			select: this.directMessageSelect}), username)
		return { disabled: res.filter(el => el.status === DirectMessageStatus.DISABLED), enabled: res.filter(el => el.status === DirectMessageStatus.ENABLED) }
	}

	private async getDmOrThrow<T extends Prisma.DirectMessageSelect>(username: string, dmId: string, select: Prisma.SelectSubset<T, Prisma.DirectMessageSelect>)
	{
		const res = await this.prisma.directMessage.findUnique({
			where:
			{
				id: dmId,
				OR:
				[
					{ requestedUserName: username },
					{ requestingUserName: username }
				]
			},
			select: select })
		if (!res)
			throw new NotFoundException(`not found dm ${dmId}`)
		return res
	}

	private async getDmElementOrThrow<Sel extends Prisma.DmDiscussionElementSelect>(username: string, select: Prisma.Subset<Sel, Prisma.DmDiscussionElementSelect>, where: Prisma.DmDiscussionElementWhereUniqueInput)
	{
		const element = await this.prisma.dmDiscussionElement.findUnique({
			where:
			{
				...where,
				directMessage:
				{
					OR:
					[
						{ requestedUserName: username },
						{ requestingUserName: username },
					]
				}
			},
			select: select })
		if (!element)
			throw new NotFoundException(`not found msg where {${where}}`)
		return element
	}

	async getDmMessages(username: string, dmId: string, nMessages: number, start?: string)
	{
		const res = await this.getDmOrThrow(username, dmId,
			{
				elements:
				{
					cursor: (start) ? { id: start } : undefined,
					orderBy: { id: 'desc' },
					take: nMessages,
					select: this.dmDiscussionElementSelect,
					skip: Number(!!start),
				}
			})
		return this.formatDmElementArray(res.elements.reverse())
	}

	async getOneDmElement(username: string, dmId: string, elementId: string)
	{
		return this.formatDmElement(await this.getDmElementOrThrow(username, this.dmDiscussionElementSelect, { id: elementId, directMessageId: dmId }))
	}

	async createDmMessage(username: string, dmId: string, content: string, relatedId?: string)
	{
		const toCheck = await this.getDmOrThrow(username, dmId,
			{
				elements: (relatedId !== undefined) &&
				{
					where: { id: relatedId },
					select: { id: true },
					take: 1
				},
				status: true
			})
		if (relatedId !== undefined && !toCheck.elements?.length)
			throw new NotFoundException(`element with id ${relatedId} not found in directMessage with id ${dmId}`)
		if (toCheck.status === DirectMessageStatus.DISABLED)
			throw new ForbiddenException(`DISABLED Dm`)
		const res = (await this.prisma.dmDiscussionMessage.create({
			data:
			{
				content: content,
				related: (relatedId !== undefined) ?
				{
					connect: { id: relatedId }
				}: undefined,
				discussionElement:
				{
					create:
					{
						author: username,
						directMessageId: dmId
					}
				}
			},
			select:
			{
				discussionElement: { select: this.dmDiscussionElementSelect }
			}})).discussionElement
		if (!res)
			throw new InternalServerErrorException('discussion element creation failed')
		const formattedRes = this.formatDmElement(res)
		await this.notifyOtherMemberOfDm(username, dmId,
			{
				type: 'CREATED_DM_ELEMENT',
				data: { dmId: dmId, element: formattedRes } 
			})
		return formattedRes
	}

	async updateOneMessage(username: string, dmId: string, elementId: string, content: string)
	{
		const element = await this.getDmElementOrThrow(username, { author: true, messageId: true }, { id: elementId, directMessageId: dmId })
		if (element.author !== username)
			throw new ForbiddenException('not owned message')
		if (!element.messageId)
			throw new ForbiddenException("event can't be updated")
		const updatedElement = this.formatDmElement(await this.prisma.dmDiscussionElement.update({
			where: { id: elementId },
			data: { message: { update: { content: content } } },
			select: this.dmDiscussionElementSelect }))
		await this.notifyOtherMemberOfDm(username, dmId,
			{
				type: 'UPDATED_DM_MESSAGE',
				data: { dmId: dmId, element: updatedElement }
			})
		return updatedElement
	}

	// a bit dirty
	async deleteDmMessage(username: string, dmId: string, elementId: string)
	{
		const element = await this.getDmElementOrThrow(username, { author: true, messageId: true }, { id: elementId, directMessageId: dmId })
		if (element.author !== username)
			throw new ForbiddenException('not owned message')
		if (!element.messageId)
			throw new ForbiddenException("event can't be deleted")
		const trueMsgId: string = element.messageId
		await this.prisma.dmDiscussionElement.update({ where: { id: elementId },
			data:
			{
				event: { create: { classicDmDiscussionEvent: { create: { eventType: ClassicDmEventType.DELETED_MESSAGE } } } },
			}})
		const res = this.formatDmElement(await this.prisma.dmDiscussionElement.update({ where: { id: elementId },
			data:
			{
				message: { delete: { id: trueMsgId } },
			},
			select: this.dmDiscussionElementSelect }))
		await this.notifyOtherMemberOfDm(username, dmId,
			{
				type: 'CREATED_DM_ELEMENT',
				data: { dmId: dmId, element: res }
			})
		return res
	}

	async notifyOtherMemberOfDm(username: string, dmId: string, event: DmEvent)
	{
		const { requestedUserName, requestingUserName } = await this.getDmOrThrow(username, dmId, { requestingUserName: true, requestedUserName: true })
		return this.sse.pushEvent((requestedUserName !== username) ? requestedUserName : requestingUserName, event)
	}
}
