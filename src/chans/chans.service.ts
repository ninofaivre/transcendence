import { BadRequestException, ConflictException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ChanType, PermissionList, Prisma, RoleApplyingType, ChanInvitationStatus, ClassicChanEventType } from '@prisma/client';
import { compareSync, hash } from 'bcrypt';
import { PrismaService } from 'nestjs-prisma';
import { AppService } from 'src/app.service';
import { PermissionsService } from './permissions/permissions.service';
import { EventTypeList, SseService } from 'src/sse/sse.service';
import { NestRequestShapes, nestControllerContract } from '@ts-rest/nest';
import contract from 'contract/contract';
import { zCreatePrivateChan, zCreatePublicChan } from 'contract/zod/chan.zod';
import { Action, CaslAbilityFactory, ChanAction } from 'src/casl/casl-ability.factory/casl-ability.factory';
import { ForbiddenError, subject } from '@casl/ability';
import { UserService } from 'src/user/user.service';
import { ChanEvent, zChanDiscussionElementReturn, zChanDiscussionEventReturn } from 'contract/routers/chans';
import { z } from 'zod';

const c = nestControllerContract(contract.chans)
type RequestShapes = NestRequestShapes<typeof c>

@Injectable()
export class ChansService {

	constructor(private readonly prisma: PrismaService,
				private readonly permissionsService: PermissionsService,
				private readonly appService: AppService,
				private readonly sse: SseService,
			    private readonly caslFact: CaslAbilityFactory,
			    private readonly usersService: UserService) {}

	private usersSelect =
	{
		name: true,
	} satisfies Prisma.UserSelect

	private rolesSelect =
	{
		permissions: true,
		roleApplyOn: true,
		roles: { select: { name: true } },
		name: true,
		users: { select: this.usersSelect },
	} satisfies Prisma.RoleSelect

	private rolesGetPayload =
	{
		select: this.rolesSelect
	} satisfies Prisma.RoleArgs

	private chansSelect =
	{
		id: true,
		title: true,
		type: true,
		ownerName: true,
		users: { select: this.usersSelect },
		roles: { select: this.rolesSelect },
	} satisfies Prisma.ChanSelect

	private chansGetPayload =
	{
		select: this.chansSelect
	} satisfies Prisma.ChanArgs

	private chanDiscussionEventsSelect =
	{
		concernedUserName: true,
		classicChanDiscussionEvent: { select: { eventType: true } },
		changedTitleChanDiscussionEvent: { select: { oldTitle: true, newTitle: true } }
	} satisfies Prisma.ChanDiscussionEventSelect

	private chanDiscussionEventsGetPayload =
	{
		select: this.chanDiscussionEventsSelect
	} satisfies Prisma.ChanDiscussionEventArgs

	private chanDiscussionMessagesSelect =
	{
		content: true,
		relatedTo: true,
		relatedUsers: { select: { name: true } },
		relatedRoles: { select: { name: true } },
	} satisfies Prisma.ChanDiscussionMessageSelect

	private chanDiscussionMessagesGetPayload =
	{
		select: this.chanDiscussionMessagesSelect
	} satisfies Prisma.ChanDiscussionMessageArgs

	private chanDiscussionElementsSelect =
	{
		id: true,
		event: { select: this.chanDiscussionEventsSelect },
		message: { select: this.chanDiscussionMessagesSelect },
		authorName: true,
		creationDate: true
	} satisfies Prisma.ChanDiscussionElementSelect

	private chanDiscussionElementsGetPayload =
	{
		select: this.chanDiscussionElementsSelect
	} satisfies Prisma.ChanDiscussionElementArgs

	// private defaultPermissions: PermissionList[] =
	// 	[
	// 		'INVITE',
	// 		'SEND_MESSAGE',
	// 	]
	//
	// private adminPermissions: PermissionList[] =
	// 	[
	// 		'KICK',
	// 		'BAN',
	// 		'MUTE'
	// 	]

	private namesArrayToStringArray(users: { name: string }[])
	{
		return users.map(el => el.name)
	}

	private formatRole(role: Prisma.RoleGetPayload<typeof this.rolesGetPayload>)
	{
		const { roles, users } = role
		return {
			...role,
			roles: this.namesArrayToStringArray(roles),
			users: this.namesArrayToStringArray(users),
		}
	}

	private formatChan(chan: Prisma.ChanGetPayload<typeof this.chansGetPayload>)
	{
		const { roles, users } = chan
		return {
			...chan,
			users: this.namesArrayToStringArray(users),
			roles: roles.map(el => this.formatRole(el)),
		}
	}

	private formatChanDiscussionMessage(message: Prisma.ChanDiscussionMessageGetPayload<typeof this.chanDiscussionMessagesGetPayload>)
	{
		const { relatedRoles, relatedUsers } = message

		const formattedRelatedRoles = this.namesArrayToStringArray(relatedRoles)
		const formattedRelatedUsers = this.namesArrayToStringArray(relatedUsers)

		return { ...message, relatedRoles: formattedRelatedRoles, relatedUsers: formattedRelatedUsers }
	}

	private formatChanDiscussionEvent(event: Prisma.ChanDiscussionEventGetPayload<typeof this.chanDiscussionEventsGetPayload>)
	: z.infer<typeof zChanDiscussionEventReturn>
	{
		type RetypedEvent = (Omit<typeof event, 'classicChanDiscussionEvent' | 'changedTitleChanDiscussionEvent'> & { classicChanDiscussionEvent: null, changedTitleChanDiscussionEvent: Exclude<typeof event.changedTitleChanDiscussionEvent, null> }) |
		(Omit<typeof event, 'classicChanDiscussionEvent' | 'changedTitleChanDiscussionEvent'> & { classicChanDiscussionEvent: Exclude<typeof event.classicChanDiscussionEvent, null>, changedTitleChanDiscussionEvent: null })
		const retypedEvent = event as RetypedEvent

		const { classicChanDiscussionEvent, changedTitleChanDiscussionEvent, ...rest } = retypedEvent

		if (changedTitleChanDiscussionEvent)
			return { ...rest, eventType: 'CHANGED_TITLE', ...changedTitleChanDiscussionEvent  }
		else
			return { ...rest, ...classicChanDiscussionEvent }
	}

	private formatChanDiscussionElement(element: Prisma.ChanDiscussionElementGetPayload<typeof this.chanDiscussionElementsGetPayload>)
	: z.infer<typeof zChanDiscussionElementReturn>
	{
		type RetypedElement = (Omit<typeof element, 'event' | 'message'> & { event: null, message: Exclude<typeof element.message, null> }) |
		(Omit<typeof element, 'event' | 'message'> & { event: Exclude<typeof element.event, null>, message: null })
		const retypedElement = element as RetypedElement

		const { event, message, ...rest } = retypedElement
		if (event)
			return { ...rest, type: 'event', event: this.formatChanDiscussionEvent(event) }
		else
			return { ...rest, type: 'message', message: this.formatChanDiscussionMessage(message) }
	}

	// async getUserChans(username: string) {
	// 	// TODO: test later if find user then select chan is faster
	// 	return this.prisma.chan.findMany({
	// 		where:
	// 		{
	// 			users: { some: { name: username } }
	// 		},
	// 		select: ChansService.chansSelect,
	// 		orderBy: { type: 'desc' }
	// 	})
	// }
	//
	// async createChan(username: string, chan: RequestShapes['createChan']['body']) {
	// 	if (chan.type === "PUBLIC" && chan.password)
	// 		chan.password = await hash(chan.password, 10)
	// 	try {
	// 		const res = await this.prisma.chan.create({
	// 			data:
	// 			{
	// 				...chan,
	// 				owner: { connect: { name: username } },
	// 				users: { connect: { name: username } },
	// 				roles:
	// 				{
	// 					createMany:
	// 					{
	// 						data:
	// 							[
	// 								{
	// 									name: 'DEFAULT',
	// 									permissions: this.defaultPermissions,
	// 									roleApplyOn: RoleApplyingType.NONE,
	// 								},
	// 								{
	// 									name: 'ADMIN',
	// 									permissions: this.adminPermissions,
	// 									roleApplyOn: RoleApplyingType.ROLES,
	// 								}
	// 							]
	// 					},
	// 				},
	// 			},
	// 			select: ChansService.chansSelect
	// 		})
	// 		await this.prisma.role.update({
	// 			where: { chanId_name: { chanId: res.id, name: 'ADMIN' } },
	// 			data:
	// 			{
	// 				roles: { connect: { chanId_name: { chanId: res.id, name: 'DEFAULT' } } }
	// 			}
	// 		})
	// 		res.roles.find(el => el.name === 'ADMIN')?.roles.push({ name: "DEFAULT" })
	// 		return res
	// 	}
	// 	catch
	// 	{
	// 		throw new ConflictException(`conflict, a chan with the  title ${chan.title} already exist`)
	// 	}
	// }
	//
	// async udpateEventsAndNotifyForDeletedChanInvitationsList(invs: { id: number, discussionEventId: number }[], newEventType: EventType)
	// {
	// 	const discussionEventIds = invs.map(inv => inv.discussionEventId)
	// 	const invIds = invs.map(inv => inv.id)
	// 	await this.prisma.discussionEvent.updateMany({ where: { id: { in: discussionEventIds } },
	// 		data: { eventType: newEventType } })
	// 	const res = await this.prisma.discussionEvent.findMany({ where: { id: { in: discussionEventIds } },
	// 		select:
	// 		{
	// 			discussionElement:
	// 			{
	// 				select:
	// 				{
	// 					directMessage: { select: { id: true, requestedUserName: true, requestingUserName: true } },
	// 					...this.appService.discussionElementsSelect
	// 				}
	// 			}
	// 		} })
	// 		await Promise.all(res.map(async el =>
	// 			{
	// 				const { directMessage, ...event } = el.discussionElement
	// 				if (!directMessage)
	// 					return
	// 				const { requestingUserName: usernameA, requestedUserName: usernameB, id: directMessageId } = directMessage
	// 				return Promise.all([ this.sseService.pushEventMultipleUser([usernameA, usernameB],
	// 					{
	// 						type: EventTypeList.DM_UPDATED_EVENT,
	// 						data: { directMessageId: directMessageId, updatedEvent: event }
	// 					}),
	// 					this.sseService.pushEventMultipleUser([usernameA, usernameB],
	// 					{
	// 						type: EventTypeList.DELETED_CHAN_INVITATION,
	// 						data: { chanInvitationId: invs.find(el => el.discussionEventId === event.id)?.id, reason: newEventType }
	// 					})
	// 				])
	// 			}))
	// }
	//
	// async deleteChan(username: string, id: number) {
	// 	await this.checkAbilities(username, id,
	// 		[
	// 			{ action: Action.Delete, subject: subject('Chan', await this.caslFact.getChan(id)) }
	// 		])
	//
	// 	// get list d'inv
	// 	const invitations = this.prisma.chan.findUnique({ where: { id: id }, select: { invitations: { select: { id: true, discussionEventId: true } } } })
	//
	// 	// update inv event in dm
	// 	// get les events update
	// 	// notify les event update
	//
	// 	// /* Update Invitations Dms Events */
	// 	// const invitations = toCheck.invitations.filter(el => el.discussionEventId != null)
	// 	// await this.prisma.discussionEvent.updateMany({
	// 	// 	where: { id: { in: invitations.map(el => el.discussionEventId) } },
	// 	// 	data:
	// 	// 	{
	// 	// 		eventType: EventType.CHAN_DELETED_INVITATION
	// 	// 	}
	// 	// })
	// 	// const newEvents = (await this.prisma.discussionEvent.findMany({
	// 	// 	where: { id: { in: toCheck.invitations.map(el => el.discussionEventId) } },
	// 	// 	select:
	// 	// 	{
	// 	// 		discussionElement:
	// 	// 		{
	// 	// 			select:
	// 	// 			{
	// 	// 				directMessage: { select: { id: true, requestingUserName: true, requestedUserName: true } },
	// 	// 				...this.appService.discussionElementsSelect
	// 	// 			}
	// 	// 		}
	// 	// 	}
	// 	// })).map(el => el.discussionElement)
	// 	//
	// 	// await Promise.all(newEvents.map(async ev => {
	// 	// 	const { directMessage, ...event } = ev
	// 	// 	if (!directMessage)
	// 	// 		return
	// 	// 	return this.sseService.pushEventMultipleUser([directMessage.requestingUserName, directMessage.requestedUserName],
	// 	// 		{
	// 	// 			type: EventTypeList.DM_NEW_EVENT,
	// 	// 			data:
	// 	// 			{
	// 	// 				directMessageId: directMessage.id,
	// 	// 				event: event
	// 	// 			}
	// 	// 		})
	// 	// }))
	// 	// /* Update Invitations Dms Events */
	// 	//
	// 	// const toNotify = (await this.prisma.chan.delete({
	// 	// 	where: { id: id },
	// 	// 	select:
	// 	// 	{
	// 	// 		users: { select: ChansService.usersSelect }
	// 	// 	}
	// 	// })).users
	// 	// await this.sseService.pushEventMultipleUser(toNotify.map(el => el.name), { type: EventTypeList.CHAN_DELETED, data: { chanId: id } })
	// }
	//
	// async leaveChan(username: string, id: number) {
	// 	await this.checkAbilities(username, id,
	// 		[
	// 			{ action: ChanAction.Leave, subject: subject('Chan', await this.caslFact.getChan(id)) }
	// 		])
	// 	await this.prisma.chan.update({
	// 		where: { id: id },
	// 		data:
	// 		{
	// 			users: { disconnect: { name: username } },
	// 		}})
	// 	const newChanEvent = await this.createChanEvent(username, id, EventType.AUTHOR_LEAVED)
	// 	await this.notifyChanEventToChanUsers(id, newChanEvent)
	// }
	//
	// async formatChanMessage(chanMsg: Prisma.PromiseReturnType<typeof this.createChanMessage>) {
	// 	// TODO: find a way to handle this shit
	// 	if (chanMsg.message) {
	// 		const msg = { ...chanMsg.message, relatedRoles: this.namesArrayToStringArray(chanMsg.message.relatedRoles), relatedUsers: this.namesArrayToStringArray(chanMsg.message.relatedUsers) }
	// 		return { ...chanMsg, message: msg, event: null }
	// 	}
	// 	else
	// 		return { ...chanMsg, message: null }
	// }
	//
	// async createChanMessage(username: string, chanId: number, content: string, relatedTo?: number, usersAt?: string[]) {
	// 	return (await this.prisma.discussionMessage.create({
	// 		data:
	// 		{
	// 			content: content,
	// 			relatedUsers: usersAt &&
	// 			{
	// 				connect: usersAt.map(el => { return { name: el } })
	// 			},
	// 			related: (relatedTo) ?
	// 				{
	// 					connect: { id: relatedTo }
	// 				} : undefined,
	// 			discussionElement:
	// 			{
	// 				create:
	// 				{
	// 					chanId: chanId,
	// 					author: username,
	// 				}
	// 			}
	// 		},
	// 		select:
	// 		{
	// 			discussionElement: { select: ChansService.discussionElementsSelect }
	// 		}
	// 	})).discussionElement
	// }

	// TODO: type state
	public async removeMutedIfUntilDateReached(state: any) {
		if (!state.untilDate || new Date() < state.untilDate)
			return false
		await this.prisma.mutedUserChan.delete({ where: { id: state.id }, select: { id: true } })
		return true
	}

	// async getnUsersFromArrayInChan(usernames: string[], chanId: number)
	// {
	// 	const chan = await this.prisma.chan.findUnique({ where: { id: chanId },
	// 		select:
	// 		{
	// 			users: { where: { name: { in: usernames } }, select: { name: true } }
	// 		}
	// 	})
	// 	if (!chan)
	// 		return -1
	// 	return chan.users.length
	// }
	//
	// async createChanMessageIfRightTo(username: string, chanId: number, dto: RequestShapes['createChanMessage']['body']) {
	// 	const { relatedTo, content, usersAt } = dto
	// 	await this.checkAbilities(username, chanId,
	// 		[
	// 			{ action: Action.Create, subject: 'Message' }
	// 		])
	// 	const toCheck = await this.prisma.chan.findUnique({
	// 		where: { id: chanId },
	// 		select:
	// 		{
	// 			elements: !!relatedTo &&
	// 			{
	// 				where: { id: relatedTo },
	// 				select: { id: true },
	// 			},
	// 		}
	// 	})
	// 	if (relatedTo && !toCheck?.elements.length)
	// 		throw new ForbiddenException(`msg with id ${relatedTo} not found`)
	// 	if (usersAt && await this.getnUsersFromArrayInChan(usersAt, chanId) === usersAt.length)
	// 		throw new ForbiddenException(`some users at not found`)
	// 	const res = await this.createChanMessage(username, chanId, content, relatedTo, usersAt || [])
	// 	await this.notifyChanMessageToChanUsers(chanId, res)
	// 	return res
	// }
	//
	// async getChanMessageById(id: number)
	// {
	// 	return this.prisma.discussionElement.findUnique
	// 	({
	// 		where: { id: id },
	// 		select: ChansService.discussionElementsSelect
	// 	})
	// }
	//
	// async getChanMessages(username: string, chanId: number, nMessages: number, start?: number) {
	// 	const res = await this.prisma.chan.findUnique({
	// 		where:
	// 		{
	// 			id: chanId,
	// 			users: { some: { name: username } }
	// 		},
	// 		select:
	// 		{
	// 			elements:
	// 			{
	// 				cursor: (start) ? { id: start } : undefined,
	// 				orderBy: { id: 'desc' },
	// 				take: nMessages,
	// 				skip: Number(!!start),
	// 				select: ChansService.discussionElementsSelect,
	// 			}
	// 		}
	// 	})
	// 	if (!res)
	// 		throw new NotFoundException(`chan with id ${chanId} not found`)
	// 	return res.elements.reverse()
	// }
	//
	// async deleteChanMessage(username: string, chanId: number, msgId: number) {
	// 	// const ability = this.caslFact.createAbility({ name: username })
	// 	// const res = await this.prisma.discussionElement.findUnique({ where: { id: msgId }, include: { event: true, message: true } })
	// 	// if (res)
	// 	// {
	// 	// 	console.log('CAN :', ability.can(Action.Delete, subject('Message', res)))
	// 	// }
	// 	// const toCheck = await this.prisma.chan.findUnique({
	// 	// 	where:
	// 	// 	{
	// 	// 		id: chanId,
	// 	// 		users: { some: { name: username } }
	// 	// 	},
	// 	// 	select:
	// 	// 	{
	// 	// 		elements:
	// 	// 		{
	// 	// 			where:
	// 	// 			{
	// 	// 				id: msgId,
	// 	// 				message: { discussionElementId: msgId }
	// 	// 			},
	// 	// 			select:
	// 	// 			{
	// 	// 				message: { select: { id: true } },
	// 	// 				author: true
	// 	// 			},
	// 	// 			take: 1
	// 	// 		},
	// 	// 		users:
	// 	// 		{
	// 	// 			where: { name: { not: username } },
	// 	// 			select: { name: true }
	// 	// 		}
	// 	// 	}
	// 	// })
	// 	// if (!toCheck)
	// 	// 	throw new NotFoundException(`chan with id ${chanId} not found`)
	// 	// if (!toCheck.elements.length)
	// 	// 	throw new NotFoundException(`msg with id ${msgId} not found in chan with id ${chanId}`)
	// 	// const author = toCheck.elements[0].author
	// 	// if (!(await this.permissionsService.doesUserHasRightTo(username, author, PermissionList.DELETE_MESSAGE, chanId)))
	// 	// 	throw new ForbiddenException(`you don't have the right to do delete this msg`)
	// 	// const res = await this.prisma.discussionElement.update({
	// 	// 	where: { id: msgId },
	// 	// 	data:
	// 	// 	{
	// 	// 		message: { delete: {} },
	// 	// 		event: { create: { eventType: EventType.MESSAGE_DELETED } },
	// 	// 	},
	// 	// 	select: ChansService.discussionElementsSelect
	// 	// })
	// 	// await this.notifyChanEvent(toCheck.users, chanId, res)
	// }
	//
	// // TODO: Maybe createChanEvent and removing user from chan need to be in a transaction so if the creation of the event failed the user is not removed from the chan
	// async kickUserFromChan(username: string, toKick: string, chanId: number)
	// {
	// 	await this.checkAbilities(username, chanId,
	// 		[
	// 			{ action: ChanAction.Kick, subject: subject('ChanUser', await this.caslFact.getUser(chanId, toKick)) }
	// 		])
	// 	await this.prisma.chan.update({
	// 		where: { id: chanId },
	// 		data:
	// 		{
	// 			users: { disconnect: { name: toKick } }
	// 		}})
	// 	const newChanEvent = await this.createChanEvent(username, chanId, EventType.AUTHOR_KICKED_CONCERNED, toKick)
	// 	await this.notifyChanEventToChanUsers(chanId, newChanEvent)
	// 	await this.notifyChanEventToUser(toKick, chanId, newChanEvent)
	// }
	//
	// async createChanEvent(author: string, chanId: number, eventType: EventType, concerned?: string) {
	// 	return (await this.prisma.discussionEvent.create({
	// 		data:
	// 		{
	// 			eventType: eventType,
	// 			concernedUserRelation: (concerned) ? { connect: { name: concerned } } : undefined,
	// 			discussionElement:
	// 			{
	// 				create:
	// 				{
	// 					authorRelation: { connect: { name: author } },
	// 					chan: { connect: { id: chanId } }
	// 				}
	// 			}
	// 		},
	// 		select:
	// 		{
	// 			discussionElement: { select: ChansService.discussionElementsSelect }
	// 		}
	// 	})).discussionElement
	// }
	//
	// async notifyChanUsers(chanId: number, toNotify: any)
	// {
	// 	const res = await this.prisma.chan.findUnique({ where: { id: chanId }, select: { users: { select: { name: true } } } })
	// 	if (!res)
	// 		return
	// 	return this.sseService.pushEventMultipleUser(res.users.map(el => el.name), toNotify)
	// }
	//
	// async notifyChanEventToChanUsers(chanId: number, event: Prisma.PromiseReturnType<typeof this.createChanEvent>)
	// {
	// 	return this.notifyChanUsers(chanId, { type: EventTypeList.CHAN_NEW_EVENT, data: { chanId: chanId, event: event } })
	// }
	//
	// async notifyChanEventToUser(username: string, chanId: number, event: Prisma.PromiseReturnType<typeof this.createChanEvent>)
	// {
	// 	return this.sseService.pushEvent(username,
	// 		{
	// 			type: EventTypeList.CHAN_NEW_EVENT,
	// 			data: { chanId: chanId, event: event }
	// 		})
	// }
	//
	// async notifyChanMessageToChanUsers(chanId: number, message: Prisma.PromiseReturnType<typeof this.createChanMessage>)
	// {
	// 	return this.notifyChanUsers(chanId,
	// 		{
	// 			type: EventTypeList.CHAN_NEW_MESSAGE,
	// 			data: { chanId: chanId, message: message }
	// 		})
	// }
	private async notifyChan(chanId: string, toNotify: ChanEvent)
	{
		const userNames = (await this.prisma.chan.findUnique({ where: { id: chanId },
			select: { users: { select: this.usersSelect } } }))?.users
		if (!userNames)
			return
		return this.sse.pushEventMultipleUser(this.namesArrayToStringArray(userNames), toNotify)
	}
	
	public async createAndNotifyClassicChanEvent(author: string, concerned: string | null, chanId: string, event: ClassicChanEventType)
	{
		const newEvent = (await this.prisma.chanDiscussionEvent.create({
			data:
			{
				classicChanDiscussionEvent:
				{
					create:
					{
						eventType: event
					}
				},
				...((concerned) ? { concernedUserRelation: { connect: { name: concerned } } } : {}),
				discussionElement:
				{
					create:
					{
						chanId: chanId,
						authorName: author
					}
				}
			},
			select: { discussionElement: { select: this.chanDiscussionElementsSelect }} })).discussionElement
		if (!newEvent)
			throw new InternalServerErrorException('a discussion event has failed to be created')
		const formattedNewEvent = this.formatChanDiscussionElement(newEvent)
		return this.notifyChan(chanId, { type: 'CREATED_CHAN_EVENT', data: { chanId: chanId, element: formattedNewEvent } })
	}
	
	public async pushUserToChan(username: string, chanId: string)
	{
		return this.formatChan(await this.prisma.chan.update({
			where: { id: chanId },
			data: { users: { connect: { name: username } } },
			select: this.chansSelect }))
	}

	public async doesUsersHasCommonChan(usernameA: string, usernameB: string)
	{
		return Boolean(await this.prisma.chan.count({
			where:
			{
				AND:
				[
					{ users: { some: { name: usernameA } } },
					{ users: { some: { name: usernameB } } }
				]
			},
			take: 1 }))
	}

	// private async addUserToChan(username: string, chanId: number) {
	// 	const res = await this.prisma.chan.update({
	// 		where: { id: chanId },
	// 		data: { users: { connect: { name: username } } },
	// 		select: ChansService.chansSelect
	// 	})
	// 	if (res.roles.some(el => el.name === 'DEFAULT')) {
	// 		await this.prisma.role.update({
	// 			where: { chanId_name: { chanId: chanId, name: 'DEFAULT' } },
	// 			data: { users: { connect: { name: username } } }
	// 		})
	// 	}
	// 	const newEvent = await this.prisma.discussionElement.create({
	// 		data:
	// 		{
	// 			chan: { connect: { id: chanId } },
	// 			authorRelation: { connect: { name: username } },
	// 			event:
	// 			{
	// 				create:
	// 				{
	// 					eventType: EventType.AUTHOR_JOINED
	// 				}
	// 			}
	// 		},
	// 		select: this.appService.discussionElementsSelect
	// 	})

	// 	await this.sseService.pushEventMultipleUser(res.users.map(el => el.name),
	// 		{
	// 			type: EventTypeList.CHAN_NEW_EVENT,
	// 			data: { chanId: chanId, event: newEvent }
	// 		})
	// 	return res
	// }
	//
	// async deleteAllInvitationsToChanForUser(username: string, chanId: number) {
	// 	// Get all Invitations
	// 	let invitations = (await this.prisma.user.findUnique({
	// 		where: { name: username },
	// 		select:
	// 		{
	// 			incomingChanInvitation:
	// 			{
	// 				where: { chanId: chanId },
	// 				select:
	// 				{
	// 					id: true,
	// 					requestingUserName: true,
	// 					discussionEvent: { select: { id: true } },
	// 					friendShip: { select: { directMessage: { select: { id: true } } } }
	// 				}
	// 			}
	// 		}
	// 	}))?.incomingChanInvitation
	//
	// 	if (!invitations)
	// 		throw new InternalServerErrorException(`your account has been permanently deleted, please logout`)
	// 	// Delete all Invitations
	// 	await this.prisma.chanInvitation.deleteMany({ where: { id: { in: invitations.map(el => el.id) } } })
	//
	// 	// Update all invitations events in dms
	// 	await this.prisma.discussionEvent.updateMany({
	// 		where: { id: { in: invitations.filter(el => !!el.discussionEvent).map(el => el.discussionEvent.id) } },
	// 		data:
	// 		{
	// 			eventType: EventType.ACCEPTED_CHAN_INVITATION,
	// 		}
	// 	})
	//
	// 	// select on findMany because not possible on updateMany
	// 	const newEvents = (await this.prisma.discussionEvent.findMany({
	// 		where: { id: { in: invitations.map(el => el.discussionEvent.id) } },
	// 		select:
	// 		{
	// 			discussionElement:
	// 			{
	// 				select:
	// 				{
	// 					directMessage: { select: { id: true, requestingUserName: true, requestedUserName: true } },
	// 					...this.appService.discussionElementsSelect
	// 				}
	// 			}
	// 		}
	// 	})).map(el => el.discussionElement)
	//
	// 	// sse notify for updated invitations events in dms
	// 	await Promise.all(newEvents.map(async ev => {
	// 		const { directMessage, ...event } = ev
	// 		if (!directMessage)
	// 			return
	// 		return this.sseService.pushEventMultipleUser([directMessage.requestingUserName, directMessage.requestedUserName],
	// 			{
	// 				type: EventTypeList.DM_NEW_EVENT,
	// 				data:
	// 				{
	// 					directMessageId: directMessage.id,
	// 					event: event
	// 				}
	// 			})
	// 	}))
	// }

	// async pushUserToChanAndEmitDmEvent(username: string, chanId: number) {
	// 	const newChan = await this.addUserToChan(username, chanId)
	// 	await this.deleteAllInvitationsToChanForUser(username, chanId)
	// 	return newChan
	// }

	// async joinChanByInvitation(username: string, chanInvitationId: number) // need to split this dirty func
	// {
	// 	const toCheck = await this.prisma.chanInvitation.findUnique({
	// 		where:
	// 		{
	// 			id: chanInvitationId,
	// 			requestedUserName: username
	// 		},
	// 		select: { chanId: true }
	// 	})
	// 	if (!toCheck)
	// 		throw new ForbiddenException(`chanInvitation with id ${chanInvitationId} not found`)
	// 	return this.pushUserToChanAndEmitDmEvent(username, toCheck.chanId)
	// }
	//
	// async joinChanByid(username: string, chanId: number, password?: string) {
	// 	const toCheck = await this.prisma.chan.findUnique({
	// 		where:
	// 		{
	// 			id: chanId,
	// 			type: ChanType.PUBLIC
	// 		},
	// 		select:
	// 		{
	// 			password: true
	// 		}
	// 	})
	// 	if (!toCheck)
	// 		throw new ForbiddenException(`chan with id ${chanId} does not exist or is PRIVATE`)
	// 	if (!toCheck.password && password)
	// 		throw new BadRequestException(`chan with id ${chanId} does not have password but one was provided`)
	// 	if (toCheck.password && (!password || !compareSync(password, toCheck.password)))
	// 		throw new ForbiddenException(`wrong password`)
	//
	// 	return this.pushUserToChanAndEmitDmEvent(username, chanId)
	// }
	//
	// async searchChans(titleContains: string, nRes: number) {
	// 	const res = await this.prisma.chan.findMany({
	// 		where:
	// 		{
	// 			type: ChanType.PUBLIC,
	// 			title: { contains: titleContains, not: null },
	// 		},
	// 		select: { id: true, title: true, _count: { select: { users: true } }, password: true },
	// 		take: nRes,
	// 		orderBy: { title: 'asc' }
	// 	})
	// 	return res.map(el => {
	// 		const passwordProtected: boolean = !!el.password
	// 		const { password, _count, title, ...trimmedEl } = el
	// 		return { passwordProtected, nUsers: _count.users, title: title as string, ...trimmedEl }
	// 	})
	// }
	//
	// // TODO: test updateChan (untested)
	// // UNSTABLE
	// async updateChan(username: string, chanId: number, dto: RequestShapes['updateChan']['body']) {
	// 	const res = await this.prisma.chan.findUnique({
	// 		where: { id: chanId },
	// 		select:
	// 		{
	// 			roles:
	// 			{
	// 				where: this.permissionsService.getRolesDoesUserHasRighTo(username, username, PermissionList.EDIT),
	// 				select: { name: true },
	// 				take: 1
	// 			},
	// 			type: true,
	// 			title: true,
	// 			password: true
	// 		}
	// 	})
	// 	if (!res)
	// 		throw new NotFoundException(`chan with id ${chanId} not found`)
	// 	if (!res.roles.length)
	// 		throw new ForbiddenException(`you don't have right to edit chan with id ${chanId}`)
	// 	const tmp = new Map<string, null>()
	// 	if (!dto.type) {
	// 		const error = ((res.type === 'PRIVATE') ? zCreatePrivateChan : zCreatePublicChan).safeParse({ ...res, ...dto })
	// 		if (!error.success) {
	// 			console.log(error.error)
	// 			throw new BadRequestException(`${error.error}`)
	// 		}
	// 	}
	// 	else if (dto.type !== res.type) {
	// 		const error = ((res.type === 'PRIVATE') ? zCreatePrivateChan : zCreatePublicChan).strip().safeParse({ ...res, ...dto })
	// 		if (!error.success) {
	// 			console.log(error.error)
	// 			throw new BadRequestException(`${error.error}`)
	// 		}
	// 		for (const k in res) {
	// 			if (!(k in ((dto.type === 'PRIVATE') ? zCreatePrivateChan : zCreatePublicChan).shape))
	// 				tmp.set(k, null)
	// 		}
	// 	}
	// 	// TODO:
	// 	// * notify all members of the chan by sse
	// 	// * handle title unique constraint faillure
	// 	return this.prisma.chan.update({ where: { id: chanId }, data: { ...Object.fromEntries(tmp), ...dto }, select: ChansService.chansSelect })
	// }
	//
}
