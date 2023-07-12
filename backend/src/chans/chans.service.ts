import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	Inject,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
	forwardRef,
} from "@nestjs/common"
import {
	ChanType,
	PermissionList,
	Prisma,
	RoleApplyingType,
	ChanInvitationStatus,
	ClassicChanEventType,
} from "@prisma/client"
import { compareSync, hash } from "bcrypt"
import { SseService } from "src/sse/sse.service"
import { NestRequestShapes, nestControllerContract } from "@ts-rest/nest"
import { contract } from "contract"
import { ChanEvent, zChanDiscussionElementReturn, zChanDiscussionEventReturn } from "contract"
import { z } from "zod"
import { PrismaClientKnownRequestError } from "@prisma/client/runtime"
import { ChanInvitationsService } from "src/invitations/chan-invitations/chan-invitations.service"
import { PrismaService } from "src/prisma/prisma.service"

const c = nestControllerContract(contract.chans)
type RequestShapes = NestRequestShapes<typeof c>

@Injectable()
export class ChansService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly sse: SseService,
		// private readonly usersService: UserService,
		@Inject(forwardRef(() => ChanInvitationsService))
		private readonly chanInvitationsService: ChanInvitationsService,
	) {}

	private usersSelect = {
		name: true,
	} satisfies Prisma.UserSelect

	private rolesSelect = {
		permissions: true,
		roleApplyOn: true,
		roles: { select: { name: true } },
		name: true,
		users: { select: this.usersSelect },
	} satisfies Prisma.RoleSelect

	private rolesGetPayload = {
		select: this.rolesSelect,
	} satisfies Prisma.RoleArgs

	private chansSelect = {
		id: true,
		title: true,
		type: true,
		ownerName: true,
		users: { select: this.usersSelect },
		roles: { select: this.rolesSelect },
	} satisfies Prisma.ChanSelect

	private chansGetPayload = {
		select: this.chansSelect,
	} satisfies Prisma.ChanArgs

	private chanDiscussionEventsSelect = {
		concernedUserName: true,
		classicChanDiscussionEvent: { select: { eventType: true } },
		changedTitleChanDiscussionEvent: { select: { oldTitle: true, newTitle: true } },
		deletedMessageChanDiscussionEvent: { select: { deletingUserName: true } },
	} satisfies Prisma.ChanDiscussionEventSelect

	private chanDiscussionEventsGetPayload = {
		select: this.chanDiscussionEventsSelect,
	} satisfies Prisma.ChanDiscussionEventArgs

	private chanDiscussionMessagesSelect = {
		content: true,
		relatedTo: true,
		relatedUsers: { select: { name: true } },
		relatedRoles: { select: { name: true } },
	} satisfies Prisma.ChanDiscussionMessageSelect

	private chanDiscussionMessagesGetPayload = {
		select: this.chanDiscussionMessagesSelect,
	} satisfies Prisma.ChanDiscussionMessageArgs

	private chanDiscussionElementsSelect = {
		id: true,
		event: { select: this.chanDiscussionEventsSelect },
		message: { select: this.chanDiscussionMessagesSelect },
		authorName: true,
		creationDate: true,
	} satisfies Prisma.ChanDiscussionElementSelect

	private chanDiscussionElementsGetPayload = {
		select: this.chanDiscussionElementsSelect,
	} satisfies Prisma.ChanDiscussionElementArgs

	private defaultPermissions: PermissionList[] = ["INVITE", "SEND_MESSAGE", "DELETE_MESSAGE"]

	private adminPermissions: PermissionList[] = ["KICK", "BAN", "MUTE", "DELETE_MESSAGE"]

	private namesArrayToStringArray(users: { name: string }[]) {
		return users.map((el) => el.name)
	}

	private formatRole(role: Prisma.RoleGetPayload<typeof this.rolesGetPayload>) {
		const { roles, users } = role
		return {
			...role,
			roles: this.namesArrayToStringArray(roles),
			users: this.namesArrayToStringArray(users),
		}
	}

	private formatChan(chan: Prisma.ChanGetPayload<typeof this.chansGetPayload>) {
		const { roles, users } = chan
		return {
			...chan,
			users: this.namesArrayToStringArray(users),
			roles: roles.map((el) => this.formatRole(el)),
		}
	}

	private formatChanArray(chans: Prisma.ChanGetPayload<typeof this.chansGetPayload>[]) {
		return chans.map((chan) => this.formatChan(chan))
	}

	private formatChanDiscussionMessage(
		message: Prisma.ChanDiscussionMessageGetPayload<
			typeof this.chanDiscussionMessagesGetPayload
		>,
	) {
		const { relatedRoles, relatedUsers } = message

		const formattedRelatedRoles = this.namesArrayToStringArray(relatedRoles)
		const formattedRelatedUsers = this.namesArrayToStringArray(relatedUsers)

		return {
			...message,
			relatedRoles: formattedRelatedRoles,
			relatedUsers: formattedRelatedUsers,
		}
	}

	private formatChanDiscussionEvent(
		event: Prisma.ChanDiscussionEventGetPayload<typeof this.chanDiscussionEventsGetPayload>,
	): z.infer<typeof zChanDiscussionEventReturn> {
		type omittedEvent = Omit<
			typeof event,
			| "classicChanDiscussionEvent"
			| "changedTitleChanDiscussionEvent"
			| "deletedMessageChanDiscussionEvent"
		>

		type RetypedEvent =
			| (omittedEvent & {
					classicChanDiscussionEvent: null
					changedTitleChanDiscussionEvent: Exclude<
						typeof event.changedTitleChanDiscussionEvent,
						null
					>
					deletedMessageChanDiscussionEvent: null
			  })
			| (omittedEvent & {
					classicChanDiscussionEvent: Exclude<
						typeof event.classicChanDiscussionEvent,
						null
					>
					changedTitleChanDiscussionEvent: null
					deletedMessageChanDiscussionEvent: null
			  })
			| (omittedEvent & {
					classicChanDiscussionEvent: null
					changedTitleChanDiscussionEvent: null
					deletedMessageChanDiscussionEvent: Exclude<
						typeof event.deletedMessageChanDiscussionEvent,
						null
					>
			  })

		const retypedEvent = event as RetypedEvent

		const {
			classicChanDiscussionEvent,
			changedTitleChanDiscussionEvent,
			deletedMessageChanDiscussionEvent,
			...rest
		} = retypedEvent

		if (changedTitleChanDiscussionEvent)
			return { ...rest, eventType: "CHANGED_TITLE", ...changedTitleChanDiscussionEvent }
		if (deletedMessageChanDiscussionEvent)
			return { ...rest, eventType: "DELETED_MESSAGE", ...deletedMessageChanDiscussionEvent }
		else return { ...rest, ...classicChanDiscussionEvent }
	}

	private formatChanDiscussionElement(
		element: Prisma.ChanDiscussionElementGetPayload<
			typeof this.chanDiscussionElementsGetPayload
		>,
	): z.infer<typeof zChanDiscussionElementReturn> {
		type RetypedElement =
			| (Omit<typeof element, "event" | "message"> & {
					event: null
					message: Exclude<typeof element.message, null>
			  })
			| (Omit<typeof element, "event" | "message"> & {
					event: Exclude<typeof element.event, null>
					message: null
			  })
		const retypedElement = element as RetypedElement

		const { event, message, ...rest } = retypedElement
		if (event) return { ...rest, type: "event", event: this.formatChanDiscussionEvent(event) }
		else return { ...rest, type: "message", message: this.formatChanDiscussionMessage(message) }
	}

	private formatChanDiscussionElementArray(
		elements: Prisma.ChanDiscussionElementGetPayload<
			typeof this.chanDiscussionElementsGetPayload
		>[],
	) {
		return elements.map((element) => this.formatChanDiscussionElement(element))
	}

	async getUserChans(username: string) {
		return this.formatChanArray(
			await this.prisma.chan.findMany({
				where: {
					users: { some: { name: username } },
				},
				select: this.chansSelect,
				orderBy: { type: "desc" },
			}),
		)
	}

	async createChan(username: string, chan: RequestShapes["createChan"]["body"]) {
		if (chan.type === "PUBLIC" && chan.password) chan.password = await hash(chan.password, 10)
		try {
			const res = await this.prisma.chan.create({
				data: {
					...chan,
					owner: { connect: { name: username } },
					users: { connect: { name: username } },
					roles: {
						createMany: {
							data: [
								{
									name: "DEFAULT",
									permissions: this.defaultPermissions,
									roleApplyOn: RoleApplyingType.NONE,
								},
								{
									name: "ADMIN",
									permissions: this.adminPermissions,
									roleApplyOn: RoleApplyingType.ROLES,
								},
							],
						},
					},
				},
				select: this.chansSelect,
			})
			await this.prisma.role.update({
				where: { chanId_name: { chanId: res.id, name: "ADMIN" } },
				data: {
					roles: { connect: { chanId_name: { chanId: res.id, name: "DEFAULT" } } },
				},
			})
			res.roles.find((el) => el.name === "ADMIN")?.roles.push({ name: "DEFAULT" })
			return this.formatChan(res)
		} catch (e) {
			if (e instanceof PrismaClientKnownRequestError && e.code === "P2002")
				throw new ConflictException(`conflict, chan ${chan.title} already exist`)
			throw e
		}
	}

	async getAllPendingInvitationsIdsForChan(chanId: string) {
		return (
			await this.prisma.chan.findUniqueOrThrow({
				where: { id: chanId },
				select: {
					invitations: {
						where: { status: ChanInvitationStatus.PENDING },
						select: { id: true },
					},
				},
			})
		).invitations.map((el) => el.id)
	}

	public async throwIfUserNotAuthorizedInChan(
		username: string,
		chanId: string,
		perm: PermissionList,
	) {
		const { roles, ownerName } = await this.getChanOrThrow(
			{ id: chanId, users: { some: { name: username } } },
			{
				roles: {
					where: {
						users: { some: { name: username } },
						permissions: { has: perm },
					},
					take: 1,
					select: { name: true },
				},
				ownerName: true,
			},
		)
		if (username === ownerName) return
		if (!roles.length) throw new ForbiddenException(`${username} can't ${perm} in ${chanId}`)
	}

	async throwIfUserNotAuthorizedOverUserInChan(
		username: string,
		otherUserName: string,
		chanId: string,
		perm: PermissionList,
	) {
		const { ownerName, roles, users } = await this.getChanOrThrow(
			{ id: chanId, users: { some: { name: username } } },
			{
				roles: {
					where: {
						users: { some: { name: username } },
						roleApplyOn: { not: RoleApplyingType.NONE },
						OR: [
							{
								roleApplyOn: RoleApplyingType.ROLES,
								users: { none: { name: otherUserName } },
								roles: { some: { users: { some: { name: otherUserName } } } },
							},
							{
								roleApplyOn: RoleApplyingType.ROLES_AND_SELF,
								OR: [
									{ users: { some: { name: otherUserName } } },
									{
										roles: {
											some: { users: { some: { name: otherUserName } } },
										},
									},
								],
							},
						],
					},
					take: 1,
					select: { name: true },
				},
				ownerName: true,
				users: { where: { name: otherUserName }, take: 1, select: { name: true } },
			},
		)
		if (username === otherUserName)
			throw new BadRequestException(`${username} can't ${perm} over himself`)
		if (!users.length) throw new ForbiddenException(`${otherUserName} not in chan ${chanId}`)
		if (username === ownerName) return
		if (otherUserName === ownerName)
			throw new ForbiddenException(
				`${username} can't ${perm} in chan ${chanId} over the owner`,
			)
		if (!roles.length)
			throw new ForbiddenException(
				`${username} can't ${perm} in chan ${chanId} over ${otherUserName}`,
			)
	}

	async deleteChan(username: string, chanId: string) {
		await this.throwIfUserNotAuthorizedInChan(username, chanId, PermissionList.DESTROY)
		// a bit dangerous, need to think about what need to be in a transaction or something like that in case something fail
		Promise.all([
			// check if need to await in .then
			this.getAllPendingInvitationsIdsForChan(chanId).then((invsId) =>
				this.chanInvitationsService.updateAndNotifyManyInvs(
					ChanInvitationStatus.DELETED_CHAN,
					invsId,
				),
			),
			this.notifyChan(chanId, { type: "DELETED_CHAN", data: { chanId } }, null),
		])
		await this.prisma.chan.delete({ where: { id: chanId } })
	}

	async leaveChan(username: string, chanId: string) {
		const { ownerName } = await this.getChanOrThrow(
			{ id: chanId, users: { some: { name: username } } },
			{ ownerName: true },
		)
		if (username === ownerName)
			throw new ForbiddenException(
				"owner can't leave chan (transfer ownerShip or Delete chan)",
			)
		await this.prisma.chan.update({
			where: { id: chanId },
			data: {
				users: { disconnect: { name: username } },
			},
		})
		await this.createAndNotifyClassicChanEvent(
			username,
			null,
			chanId,
			ClassicChanEventType.AUTHOR_LEAVED,
		)
	}

	async createAndNotifyChanMessage(
		username: string,
		chanId: string,
		content: string,
		relatedTo: string | undefined,
		usersAt: string[] | undefined,
		rolesAt: string[] | undefined,
	) {
		const res = (
			await this.prisma.chanDiscussionMessage.create({
				data: {
					content: content,
					related: relatedTo
						? {
								connect: { id: relatedTo },
						  }
						: undefined,
					relatedUsers: usersAt
						? {
								connect: usersAt.map((el) => {
									return { name: el }
								}),
						  }
						: undefined,
					relatedRoles: rolesAt
						? {
								connect: rolesAt.map((el) => {
									return { chanId_name: { chanId, name: el } }
								}),
						  }
						: undefined,
					discussionElement: {
						create: {
							chanId: chanId,
							authorName: username,
						},
					},
				},
				select: {
					discussionElement: { select: this.chanDiscussionElementsSelect },
				},
			})
		).discussionElement
		if (!res) throw new InternalServerErrorException("discussion element creation failed")
		const formattedRes = this.formatChanDiscussionElement(res)
		await this.notifyChan(
			chanId,
			{ type: "CREATED_CHAN_ELEMENT", data: { chanId, element: formattedRes } },
			username,
		)
		return formattedRes
	}

	// TODO: type state
	public async removeMutedIfUntilDateReached(state: { id: string; untilDate: Date | null }) {
		if (!state.untilDate || new Date() < state.untilDate) return false
		await this.prisma.mutedUserChan.delete({ where: { id: state.id }, select: { id: true } })
		return true
	}

	async throwIfUserMutedInChan(username: string, chanId: string) {
		const { mutedUsers } = await this.getChanOrThrow(
			{ id: chanId, users: { some: { name: username } } },
			{
				mutedUsers: {
					where: { mutedUserName: username },
					take: 1,
					select: { id: true, untilDate: true },
				},
			},
		)
		if (!mutedUsers.length) return
		if (!(await this.removeMutedIfUntilDateReached(mutedUsers[0])))
			throw new ForbiddenException(`${username} muted in chan ${chanId}`)
	}

	async createChanMessageIfRightTo(
		username: string,
		chanId: string,
		dto: RequestShapes["createChanMessage"]["body"],
	) {
		const { relatedTo, content, usersAt, rolesAt } = dto
		await this.throwIfUserMutedInChan(username, chanId)
		await this.throwIfUserNotAuthorizedInChan(username, chanId, PermissionList.SEND_MESSAGE)
		const { elements, users, roles } = await this.getChanOrThrow(
			{ id: chanId },
			{
				elements: !!relatedTo && {
					where: { id: relatedTo },
					select: { id: true },
				},
				users: !!usersAt && {
					where: { name: { in: usersAt } },
					select: { name: true },
				},
				roles: !!rolesAt && {
					where: { name: { in: rolesAt } },
					select: { name: true },
				},
			},
		)
		if (relatedTo && !elements.length)
			throw new ForbiddenException(`not found element ${relatedTo} in chan ${chanId}`)
		if (usersAt && usersAt.length !== users.length)
			throw new ForbiddenException(`not found one of users ${usersAt}`)
		if (rolesAt && rolesAt.length !== roles.length)
			throw new ForbiddenException(`not found one of roles ${rolesAt}`)
		return this.createAndNotifyChanMessage(
			username,
			chanId,
			content,
			relatedTo,
			usersAt,
			rolesAt,
		)
	}

	private async getChanElementOrThrow<Sel extends Prisma.ChanDiscussionElementSelect>(
		username: string,
		chanId: string,
		elementId: string,
		select: Prisma.Subset<Sel, Prisma.ChanDiscussionElementSelect>,
	) {
		const element = await this.prisma.chanDiscussionElement.findUnique({
			where: {
				chanId: chanId,
				chan: { users: { some: { name: username } } },
				id: elementId,
			},
			select,
		})
		if (!element)
			throw new NotFoundException(`not found msg where chanId ${chanId}, id: ${elementId}`)
		return element
	}

	async getChanElementById(username: string, chanId: string, elementId: string) {
		return this.formatChanDiscussionElement(
			await this.getChanElementOrThrow(
				username,
				chanId,
				elementId,
				this.chanDiscussionElementsSelect,
			),
		)
	}

	async getChanElements(username: string, chanId: string, nElements: number, start?: string) {
		const res = await this.getChanOrThrow(
			{ id: chanId, users: { some: { name: username } } },
			{
				elements: {
					cursor: start ? { id: start } : undefined,
					orderBy: { creationDate: "desc" },
					take: nElements,
					select: this.chanDiscussionElementsSelect,
					skip: Number(!!start),
				},
			},
		)
		return this.formatChanDiscussionElementArray(res.elements.reverse())
	}

	async deleteChanMessage(username: string, chanId: string, elementId: string) {
		const { messageId, authorName } = await this.getChanElementOrThrow(
			username,
			chanId,
			elementId,
			{ authorName: true, messageId: true },
		)
		if (!messageId) throw new ForbiddenException("event can't be deleted")
		if (username === authorName)
			await this.throwIfUserNotAuthorizedInChan(
				username,
				chanId,
				PermissionList.DELETE_MESSAGE,
			)
		else
			await this.throwIfUserNotAuthorizedOverUserInChan(
				username,
				chanId,
				authorName,
				PermissionList.DELETE_MESSAGE,
			)
		await this.prisma.chanDiscussionElement.update({
			where: { id: elementId },
			data: {
				event: {
					create: {
						deletedMessageChanDiscussionEvent: {
							create: { deletingUserName: username },
						},
					},
				},
			},
		})
		const res = await this.prisma.chanDiscussionElement.update({
			where: { id: elementId },
			data: {
				message: { delete: { id: messageId } },
			},
			select: this.chanDiscussionElementsSelect,
		})
		const formattedRes = this.formatChanDiscussionElement({ ...res, message: null })
		await this.notifyChan(
			chanId,
			{ type: "UPDATED_CHAN_ELEMENT", data: { chanId, element: formattedRes } },
			username,
		)
		return formattedRes
	}

	async kickUserFromChan(username: string, toKickUserName: string, chanId: string) {
		await this.throwIfUserNotAuthorizedOverUserInChan(
			username,
			toKickUserName,
			chanId,
			PermissionList.KICK,
		)
		const res = this.formatChan(
			await this.prisma.chan.update({
				where: { id: chanId },
				data: { users: { disconnect: { name: toKickUserName } } },
				select: this.chansSelect,
			}),
		)

		// PRISMA SUCK
		const roles = (
			await this.prisma.role.findMany({
				where: { chanId, users: { some: { name: toKickUserName } } },
				select: { id: true },
			})
		).map((role) => role.id)
		await Promise.all(
			roles.map(async (id) =>
				this.prisma.role.update({
					where: { id },
					data: { users: { disconnect: { name: toKickUserName } } },
				}),
			),
		)

		return Promise.all([
			this.notifyChan(chanId, { type: "UPDATED_CHAN", data: res }, null),
			this.createAndNotifyClassicChanEvent(
				username,
				toKickUserName,
				chanId,
				ClassicChanEventType.AUTHOR_KICKED_CONCERNED,
			),
			this.sse.pushEvent(toKickUserName, { type: "KICKED_FROM_CHAN", data: { chanId } }),
		])
	}

	private async notifyChan(
		chanId: string,
		toNotify: ChanEvent,
		exceptionUserName: string | null,
	) {
		const userNames = (
			await this.prisma.chan.findUnique({
				where: { id: chanId },
				select: { users: { select: this.usersSelect } },
			})
		)?.users
		if (!userNames) return
		return this.sse.pushEventMultipleUser(
			this.namesArrayToStringArray(userNames).filter((name) => name !== exceptionUserName),
			toNotify,
		)
	}

	public async createAndNotifyClassicChanEvent(
		author: string,
		concerned: string | null,
		chanId: string,
		event: ClassicChanEventType,
	) {
		const newEvent = (
			await this.prisma.chanDiscussionEvent.create({
				data: {
					classicChanDiscussionEvent: {
						create: { eventType: event },
					},
					...(concerned ? { concernedUser: { connect: { name: concerned } } } : {}),
					discussionElement: {
						create: {
							chan: { connect: { id: chanId } },
							author: { connect: { name: author } },
						},
					},
				},
				select: { discussionElement: { select: this.chanDiscussionElementsSelect } },
			})
		).discussionElement
		if (!newEvent)
			throw new InternalServerErrorException("a discussion event has failed to be created")
		const formattedNewEvent = this.formatChanDiscussionElement(newEvent)
		await this.notifyChan(
			chanId,
			{ type: "CREATED_CHAN_ELEMENT", data: { chanId: chanId, element: formattedNewEvent } },
			null,
		)
	}

	// TODO: when banned user setted up in the schema check and throw here if user is banned from chan
	public async pushUserToChanAndNotifyUsers(username: string, chanId: string) {
		const newChan = this.formatChan(
			await this.prisma.chan.update({
				where: { id: chanId },
				data: {
					users: { connect: { name: username } },
					roles: {
						update: {
							where: { chanId_name: { chanId, name: "DEFAULT" } },
							data: { users: { connect: { name: username } } },
						},
					},
				},
				select: this.chansSelect,
			}),
		)

		await this.sse.pushEventMultipleUser(
			newChan.users.filter((el) => el !== username),
			{ type: "UPDATED_CHAN", data: newChan },
		)
		setTimeout(
			this.createAndNotifyClassicChanEvent.bind(this),
			0,
			username,
			null,
			chanId,
			ClassicChanEventType.AUTHOR_JOINED,
		)
		return newChan
	}

	public async doesUsersHasCommonChan(usernameA: string, usernameB: string) {
		return Boolean(
			await this.prisma.chan.count({
				where: {
					AND: [
						{ users: { some: { name: usernameA } } },
						{ users: { some: { name: usernameB } } },
					],
				},
				take: 1,
			}),
		)
	}

	async getChanOrThrow<Sel extends Prisma.ChanSelect>(
		where: Prisma.ChanWhereUniqueInput,
		select: Prisma.Subset<Sel, Prisma.ChanSelect>,
	) {
		const chan = await this.prisma.chan.findUnique({ where, select })
		if (!chan) throw new NotFoundException(`not found chan where ${JSON.stringify(where)}`)
		return chan
	}

	async joinChanById(username: string, chanId: string, password?: string) {
		const { password: chanPassword, users } = await this.getChanOrThrow(
			{
				id: chanId,
				type: ChanType.PUBLIC,
			},
			{
				password: true,
				users: { where: { name: username }, select: { name: true } },
			},
		)
		if (users.length) throw new ForbiddenException(`${username} already in chan ${chanId}`)
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
			where: {
				type: ChanType.PUBLIC,
				title: { contains: titleContains, not: null },
			},
			select: { id: true, title: true, _count: { select: { users: true } }, password: true },
			take: nRes,
			orderBy: { title: "asc" },
		})
		return res.map((el) => {
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
