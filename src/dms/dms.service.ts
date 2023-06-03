import { ConflictException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ClassicDmEventType, Prisma } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { AppService } from 'src/app.service';
import { EventTypeList, SseService } from 'src/sse/sse.service';
import { z } from 'zod';
import { zDmDiscussionElementReturn, zDmDiscussionEventReturn } from 'contract/routers/dms';
import { Tx } from 'src/types';


@Injectable()
export class DmsService
{
	constructor(private readonly prisma: PrismaService,
			    private readonly appService: AppService,
			    private readonly sseService: SseService) {}


	private directMessageSelect = Prisma.validator<Prisma.DirectMessageSelect>()
	({
		id: true,
		friendShipId: true,

		requestedUserName: true,
		requestedUserStatus: true,
		requestedUserStatusMutedUntil: true,

		requestingUserName: true,
		requestingUserStatus: true,
		requestingUserStatusMutedUntil: true,
		creationDate: true,
		status: true,
	} satisfies Prisma.DirectMessageSelect)
	
	private dmDiscussionEventSelect = Prisma.validator<Prisma.DmDiscussionEventSelect>()
	({
		classicDmDiscussionEvent: { select: { eventType: true } },
		chanInvitationDmDiscussionEvent: { select: { chanInvitation: { select: { id: true } } } }
	} satisfies Prisma.DmDiscussionEventSelect)
	
	private dmDiscussionEventGetPayload = Prisma.validator<Prisma.DmDiscussionEventArgs>()
	({
		select: this.dmDiscussionEventSelect
	} satisfies Prisma.DmDiscussionEventArgs)

	private dmDiscussionMessageSelect = Prisma.validator<Prisma.DmDiscussionMessageSelect>()
	({
		content: true,
		relatedTo: true
	} satisfies Prisma.DmDiscussionMessageSelect)

	private dmDiscussionElementSelect = Prisma.validator<Prisma.DmDiscussionElementSelect>()
	({
		id: true,
		author: true,
		creationDate: true,
		message: { select: this.dmDiscussionMessageSelect },
		event: { select: this.dmDiscussionEventSelect },
	} satisfies Prisma.DmDiscussionElementSelect)

	private dmDiscussionElementGetPayload = Prisma.validator<Prisma.DmDiscussionElementArgs>()
	({
		select: this.dmDiscussionElementSelect
	} satisfies Prisma.DmDiscussionElementArgs)

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

	public async findDmBetweenUsers<T extends Prisma.DirectMessageSelect>(usernameA: string, usernameB: string, select: Prisma.Subset<Prisma.DirectMessageSelect, T>)
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

	private getDmDiscussionEventCreateArgs<T extends Prisma.DmDiscussionEventSelect>(dmId: string, author: string, select: Prisma.Subset<T, Prisma.DmDiscussionEventSelect>)
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
			select: select 
		} satisfies Prisma.DmDiscussionEventCreateArgs
		return args
	}

	public async createClassicDmEvent(dmId: string, eventType: ClassicDmEventType, author: string)
	{
		const { data, ...rest } = this.getDmDiscussionEventCreateArgs(dmId, author, { discussionElement: { select: this.dmDiscussionElementSelect } })
		const createArgs = { ...rest, data: { classicDmDiscussionEvent: { create: { eventType: eventType } }, ...data } } satisfies Prisma.DmDiscussionEventCreateArgs
		const newEvent = (await this.prisma.dmDiscussionEvent.create(createArgs)).discussionElement
		if (!newEvent?.event?.classicDmDiscussionEvent)
			throw new InternalServerErrorException('a discussion event has failed to be created')
		const event = { ...newEvent.event, classicDmDiscussionEvent: newEvent.event.classicDmDiscussionEvent }
		return { ...newEvent, event }
	}

	public async createChanInvitationDmEvent(dmId: string, author: string, prismaInstance: Tx = this.prisma)
	{
		const { data, ...rest } = this.getDmDiscussionEventCreateArgs(dmId, author, { chanInvitationDmDiscussionEvent: { select: { id: true } } })
		const createArgs = { ...rest, data: { chanInvitationDmDiscussionEvent: { create: {} }, ...data } } satisfies Prisma.DmDiscussionEventCreateArgs
		const id = (await prismaInstance.dmDiscussionEvent.create(createArgs)).chanInvitationDmDiscussionEvent?.id
		if (!id)
			throw new InternalServerErrorException('a discussion event has failed to be created')
		return id 
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

	public async createDm(requestingUserName: string, requestedUserName: string, friendShipId: string)
	{
		const newDm = await this.prisma.directMessage.create({
				data:
				{
					requestingUserName: requestingUserName,
					requestedUserName: requestedUserName,
					friendShipId: friendShipId
				},
				select: this.directMessageSelect })
		await this.sseService.pushEventMultipleUser([requestingUserName, requestedUserName], { type: 'CREATED_DM', data: newDm })
		const newEvent = this.formatDmElement(await this.createClassicDmEvent(newDm.id, ClassicDmEventType.CREATED_FRIENDSHIP, requestedUserName))
		await this.sseService.pushEventMultipleUser([requestingUserName, requestedUserName], { type: 'CREATED_DM_EVENT', data: { dmId: newDm.id, element: newEvent } })
		return newDm.id
	}

	async getDms(username: string)
	{
		const res = await this.prisma.directMessage.findMany({
			where:
			{
				OR:
				[
					{ requestedUserName: username },
					{ requestingUserName: username }
				],
			},
			select: this.directMessageSelect})
		return { disabled: res.filter(el => !el.friendShipId), enabled: res.filter(el => el.friendShipId) }
	}

	async getDmMessages(username: string, id: string, nMessages: number, start?: string)
	{
		const res = await this.prisma.directMessage.findUnique({
			where:
			{
				id: id,
				OR:
				[
					{ requestingUserName: username },
					{ requestedUserName: username },
				],
			},
			select:
			{
				elements:
				{
					where:
					{
						event:
						{
							OR:
							[
								{ chanInvitationDmDiscussionEvent: null },
								{ chanInvitationDmDiscussionEvent: { isNot: { chanInvitation: null } } }
							]
						}
					},
					select: this.dmDiscussionElementSelect,
					take: nMessages,
					orderBy: { id: 'desc' },
					cursor: (start !== undefined) ? { id: start } : undefined,
					skip: Number(start !== undefined) ? 1 : undefined,
				}
			}})
		if (!res)
			throw new NotFoundException(`directMessage with id ${id} not found`)
		return this.formatDmElementArray(res.elements.reverse())
	}

	// async createDmMessage(username: string, dmId: number, content: string, relatedId?: number)
	// {
	// 	const toCheck = await this.prisma.directMessage.findUnique({
	// 		where:
	// 		{
	// 			id: dmId,
	// 			OR:
	// 			[
	// 				{ requestedUserName: username },
	// 				{ requestingUserName: username },
	// 			],
	// 			friendShip: { is: {} },
	// 		},
	// 		select:
	// 		{
	// 			elements: (relatedId !== undefined) &&
	// 			{
	// 				where: { id: relatedId },
	// 				select: { id: true },
	// 				take: 1
	// 			},
	// 			requestingUserName: true,
	// 			requestedUserName: true
	// 		}})
	// 	if (!toCheck)
	// 		throw new NotFoundException(`directMessage with id ${dmId} not found`)
	// 	if (relatedId !== undefined && !toCheck.elements?.length)
	// 		throw new NotFoundException(`element with id ${relatedId} not found in directMessage with id ${dmId}`)
	// 	const res = (await this.prisma.discussionMessage.create({
	// 		data:
	// 		{
	// 			content: content,
	// 			related: (relatedId !== undefined) ?
	// 			{
	// 				connect:
	// 				{
	// 					id: relatedId
	// 				}
	// 			}: undefined,
	// 			discussionElement:
	// 			{
	// 				create:
	// 				{
	// 					author: username,
	// 					directMessageId: dmId
	// 				}
	// 			}
	// 		},
	// 		select:
	// 		{
	// 			discussionElement: { select: this.appService.discussionElementsSelect }
	// 		}})).discussionElement
	// 	const toNotify: string = (toCheck.requestingUserName !== username) ? toCheck.requestingUserName : toCheck.requestedUserName
	// 	if (toNotify)
	// 	{
	// 		await this.sseService.pushEvent(toNotify,
	// 			{
	// 				type: EventTypeList.DM_NEW_MESSAGE,
	// 				data: { directMessageId: dmId, message: res } 
	// 			})
	// 	}
	// 	return res
	// }
	//
	// async deleteDmMessage(username: string, dmId: number, msgId: number)
	// {
	// 	const toCheck = await this.prisma.directMessage.findUnique({
	// 		where:
	// 		{
	// 			id: dmId,
	// 			OR:
	// 			[
	// 				{ requestedUserName: username },
	// 				{ requestingUserName: username }
	// 			],
	// 		},
	// 		select:
	// 		{
	// 			elements:
	// 			{
	// 				where:
	// 				{
	// 					id: msgId,
	// 					message: { discussionElementId: msgId },
	// 					author: username
	// 				},
	// 				select: { message: { select: { id: true } } },
	// 				take: 1
	// 			},
	// 			requestingUserName: true,
	// 			requestedUserName: true
	// 		}})
	// 	if (!toCheck)
	// 		throw new NotFoundException(`directMessage with id ${dmId} not found`)
	// 	if (!toCheck.elements.length || !toCheck.elements[0].message)
	// 		throw new NotFoundException(`message with id ${msgId} not found`)
	// 	const trueMsgId: number = toCheck.elements[0].message.id
	// 	const res = await this.prisma.discussionElement.update({ where: { id: msgId },
	// 		data:
	// 		{
	// 			message: { delete: { id: trueMsgId } },
	// 			event: { create: { eventType: EventType.MESSAGE_DELETED } },
	// 		},
	// 		select: this.appService.discussionElementsSelect})
	// 	const toNotify: string = (toCheck.requestedUserName !== username) ? toCheck.requestedUserName : toCheck.requestingUserName
	// 	if (toNotify)
	// 	{
	// 		await this.sseService.pushEvent(toNotify,
	// 			{
	// 				type: EventTypeList.DM_NEW_EVENT,
	// 				data: { directMessageId: dmId, event: res }
	// 			})
	// 	}
	// }
	//
}
