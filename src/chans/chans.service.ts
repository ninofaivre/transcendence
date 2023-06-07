import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, InternalServerErrorException, NotFoundException, forwardRef } from '@nestjs/common';
import { ChanType, PermissionList, Prisma, RoleApplyingType, ChanInvitationStatus, ClassicChanEventType } from '@prisma/client';
import { compareSync, hash } from 'bcrypt';
import { PrismaService } from 'nestjs-prisma';
import { AppService } from 'src/app.service';
import { PermissionsService } from './permissions/permissions.service';
import { EventTypeList, SseService } from 'src/sse/sse.service';
import { NestRequestShapes, nestControllerContract } from '@ts-rest/nest';
import contract from 'contract/contract';
import { Action, CaslAbilityFactory, ChanAction } from 'src/casl/casl-ability.factory/casl-ability.factory';
import { ForbiddenError, subject } from '@casl/ability';
import { UserService } from 'src/user/user.service';
import { ChanEvent, zChanDiscussionElementReturn, zChanDiscussionEventReturn } from 'contract/routers/chans';
import { z } from 'zod';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { ChanInvitationsService } from 'src/invitations/chan-invitations/chan-invitations.service';

const c = nestControllerContract(contract.chans)
type RequestShapes = NestRequestShapes<typeof c>

@Injectable()
export class ChansService {

	constructor(private readonly prisma: PrismaService,
				private readonly permissionsService: PermissionsService,
				private readonly appService: AppService,
				private readonly sse: SseService,
			    private readonly casl: CaslAbilityFactory,
			    private readonly usersService: UserService,
				@Inject(forwardRef(() => ChanInvitationsService))
			    private readonly chanInvitationsService: ChanInvitationsService) {}

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

	private defaultPermissions: PermissionList[] =
	[
		'INVITE',
		'SEND_MESSAGE',
	]

	private adminPermissions: PermissionList[] =
	[
		'KICK',
		'BAN',
		'MUTE'
	]

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

	private formatChanArray(chans: Prisma.ChanGetPayload<typeof this.chansGetPayload>[])
	{
		return chans.map(chan => this.formatChan(chan))
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

	async getUserChans(username: string) {
		return this.formatChanArray(await this.prisma.chan.findMany({
			where:
			{
				users: { some: { name: username } }
			},
			select: this.chansSelect,
			orderBy: { type: 'desc' }
		}))
	}

	async createChan(username: string, chan: RequestShapes['createChan']['body']) {
		if (chan.type === "PUBLIC" && chan.password)
			chan.password = await hash(chan.password, 10)
		try {
			const res = await this.prisma.chan.create({
				data:
				{
					...chan,
					owner: { connect: { name: username } },
					users: { connect: { name: username } },
					roles:
					{
						createMany:
						{
							data:
								[
									{
										name: 'DEFAULT',
										permissions: this.defaultPermissions,
										roleApplyOn: RoleApplyingType.NONE,
									},
									{
										name: 'ADMIN',
										permissions: this.adminPermissions,
										roleApplyOn: RoleApplyingType.ROLES,
									}
								]
						},
					},
				},
				select: this.chansSelect
			})
			await this.prisma.role.update({
				where: { chanId_name: { chanId: res.id, name: 'ADMIN' } },
				data:
				{
					roles: { connect: { chanId_name: { chanId: res.id, name: 'DEFAULT' } } }
				}
			})
			res.roles.find(el => el.name === 'ADMIN')?.roles.push({ name: "DEFAULT" })
			return this.formatChan(res)
		}
		catch (e)
		{
			if (e instanceof PrismaClientKnownRequestError)
				throw new ConflictException(`conflict, a chan with the  title ${chan.title} already exist`)
			else
				throw e
		}
	}

	async getAllPendingInvitationsIdsForChan(chanId: string)
	{
		return (await this.prisma.chan.findUniqueOrThrow({ where: { id: chanId },
			select:
			{
				invitations:
				{
					where: { status: ChanInvitationStatus.PENDING },
					select: { id: true }
				}
			} })).invitations.map(el => el.id)
	}

	async deleteChan(username: string, chanId: string)
	{
		await this.casl.checkAbilitiesForUserInChan(username, chanId,
			[
				{ action: Action.Delete, subject: subject('Chan', await this.casl.getChanOrThrow(chanId, username)) }
			])
		const pendingInvsId = await 
		// a bit dangerous, need to think about what need to be in a transaction or something like that in case something fail
		Promise.all
		([
			// check if need to await in .then
			this.getAllPendingInvitationsIdsForChan(chanId)
				.then(invsId => this.chanInvitationsService.updateAndNotifyManyInvs(ChanInvitationStatus.DELETED_CHAN, invsId)),
			this.notifyChan(chanId, { type: 'DELETED_CHAN', data: { chanId } }, null),
		])
		await this.prisma.chan.delete({ where: { id: chanId } })
	}

	async leaveChan(username: string, chanId: string) {
		await this.casl.checkAbilitiesForUserInChan(username, chanId,
			[
				{ action: ChanAction.Leave, subject: subject('Chan', await this.casl.getChanOrThrow(chanId, username)) }
			])
		await this.prisma.chan.update({
			where: { id: chanId },
			data:
			{
				users: { disconnect: { name: username } },
			}})
		await this.createAndNotifyClassicChanEvent(username, null, chanId, ClassicChanEventType.AUTHOR_LEAVED)
	}

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
	async createAndNotifyChanMessage(username: string, chanId: string, content: string, relatedTo: string | undefined, usersAt: string[] | undefined)
	{
		const res = (await this.prisma.chanDiscussionMessage.create({
			data:
			{
				content: content,
				related: (relatedTo) ?
				{
					connect: { id: relatedTo }
				} : undefined,
				relatedUsers: (usersAt) ?
				{
					connect: usersAt.map(el => { return { name: el } })
				} : undefined,
				discussionElement:
				{
					create:
					{
						chanId: chanId,
						authorName: username,
					}
				}
			},
			select:
			{
				discussionElement: { select: this.chanDiscussionElementsSelect }
			}
		})).discussionElement
		if (!res)
			throw new InternalServerErrorException('discussion element creation failed')
		const formattedRes = this.formatChanDiscussionElement(res)
		await this.notifyChan(chanId, { type: 'CREATED_CHAN_ELEMENT', data: { chanId, element: formattedRes } }, username)
		return formattedRes
	}

	// TODO: type state
	public async removeMutedIfUntilDateReached(state: any) {
		if (!state.untilDate || new Date() < state.untilDate)
			return false
		await this.prisma.mutedUserChan.delete({ where: { id: state.id }, select: { id: true } })
		return true
	}

	async createChanMessageIfRightTo(username: string, chanId: string, dto: RequestShapes['createChanMessage']['body'])
	{
		const { relatedTo, content, usersAt } = dto
		await this.casl.checkAbilitiesForUserInChan(username, chanId,
			[
				{ action: Action.Create, subject: 'Message' }
			])
		const toCheck = await this.prisma.chan.findUnique({
			where: { id: chanId },
			select:
			{
				elements: !!relatedTo &&
				{
					where: { id: relatedTo },
					select: { id: true },
				},
				users: !!usersAt &&
				{
					where: { name: { in: usersAt } },
					select: { name: true }
				}
			}
		})
		if (relatedTo && !toCheck?.elements.length)
			throw new ForbiddenException(`not found message ${relatedTo}`)
		if (usersAt && usersAt.length !== toCheck?.users.length)
			throw new ForbiddenException(`not found one of users ${usersAt}`)
		return this.createAndNotifyChanMessage(username, chanId, content, relatedTo, usersAt)
	}
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
	private async notifyChan(chanId: string, toNotify: ChanEvent, exceptionUserName: string | null)
	{
		const userNames = (await this.prisma.chan.findUnique({ where: { id: chanId },
			select: { users: { select: this.usersSelect } } }))?.users
		if (!userNames)
			return
		return this.sse.pushEventMultipleUser(this.namesArrayToStringArray(userNames).filter(name => name !== exceptionUserName), toNotify)
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
		return this.notifyChan(chanId, { type: 'CREATED_CHAN_ELEMENT', data: { chanId: chanId, element: formattedNewEvent } }, null)
	}
	
	// TODO: when banned user setted up in the schema check and throw here if user is banned from chan
	public async pushUserToChanAndNotifyUsers(username: string, chanId: string)
	{
		const newChan = this.formatChan(await this.prisma.chan.update({
			where: { id: chanId },
			data: { users: { connect: { name: username } } },
			select: this.chansSelect }))

		this.sse.pushEventMultipleUser(newChan.users.filter(el => el !== username), { type: 'UPDATED_CHAN', data: newChan })
		setTimeout(this.createAndNotifyClassicChanEvent, 0, username, null, chanId, ClassicChanEventType.AUTHOR_JOINED)
		return newChan
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

	async getChanOrThrow<Sel extends Prisma.ChanSelect>(where: Prisma.ChanWhereUniqueInput, select: Prisma.Subset<Sel, Prisma.ChanSelect>)
	{
		const chan = await this.prisma.chan.findUnique({ where, select })
		if (!chan)
			throw new NotFoundException(`not found chan where ${where}`)
		return chan
	}

	async joinChanById(username: string, chanId: string, password?: string) {
		const { password: chanPassword } = await this.getChanOrThrow(
			{
				id: chanId,
				type: ChanType.PUBLIC
			},
			{
				password: true
			})
		if (password && !chanPassword)
			throw new BadRequestException(`chan ${chanId} doesn't has a password`)
		if (!password && chanPassword)
			throw new BadRequestException(`chan ${chanId} has a password`)
		if (chanPassword && password && !compareSync(password, chanPassword))
			throw new ForbiddenException(`chan ${chanId} wrong password`)
		await this.chanInvitationsService.acceptAllChanInvitationsForUser(username, chanId)
		return this.pushUserToChanAndNotifyUsers(username, chanId)
	}

	async searchChans(titleContains: string, nRes: number) {
		const res = await this.prisma.chan.findMany({
			where:
			{
				type: ChanType.PUBLIC,
				title: { contains: titleContains, not: null },
			},
			select: { id: true, title: true, _count: { select: { users: true } }, password: true },
			take: nRes,
			orderBy: { title: 'asc' }
		})
		return res.map(el => {
			const passwordProtected: boolean = !!el.password
			const { password, _count, title, ...trimmedEl } = el
			return { passwordProtected, nUsers: _count.users, title: title as string, ...trimmedEl }
		})
	}

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
