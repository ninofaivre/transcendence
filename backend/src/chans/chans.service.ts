import { Inject, Injectable, forwardRef } from "@nestjs/common"
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
import { NestRequestShapes } from "@ts-rest/nest"
import { contract, contractErrors, isContractError } from "contract"
import { ChanEvent, zChanDiscussionElementReturn, zChanDiscussionEventReturn } from "contract"
import { z } from "zod"
import { ChanInvitationsService } from "src/invitations/chan-invitations/chan-invitations.service"
import { PrismaService } from "src/prisma/prisma.service"
import { UserService } from "src/user/user.service"
import { ChanRetypedElement, ChanRetypedElementTest, ChanRetypedEvent, RetypedElement, RetypedEvent } from "src/types"
import { zSelfPermissionList } from "contract"
import { zChanDiscussionMessageReturn } from "contract"

type RequestShapes = NestRequestShapes<typeof contract.chans>

type ChanDiscussionElementPayload = Prisma.ChanDiscussionElementGetPayload<
    { select: ChansService['chanDiscussionElementsSelect'] }>
type ChanDiscussionMessagePayload = Prisma.ChanDiscussionMessageGetPayload<
    { select: ChansService['chanDiscussionMessagesSelect'] }>
type ChanDiscussionEventPayload = Prisma.ChanDiscussionEventGetPayload<
    { select: ChansService['chanDiscussionEventsSelect'] }>
type ChanPayload = Prisma.ChanGetPayload<
    { select: ReturnType<ChansService['getChansSelect']> }>
type DoesUserHasSelfPermPayload = Prisma.ChanGetPayload<
    { select: ReturnType<ChansService['getDoesUserHasSelfPermSelect']> }>
type DoesUserHasPermOverUserPayload = Prisma.ChanGetPayload<
    { select: ReturnType<ChansService['getDoesUserHasPermOverUserSelect']> }>

@Injectable()
export class ChansService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly sse: SseService,
		@Inject(forwardRef(() => UserService))
		private readonly usersService: UserService,
		@Inject(forwardRef(() => ChanInvitationsService))
		private readonly chanInvitationsService: ChanInvitationsService,
	) {}

	private usersSelect = {
		name: true,
	} satisfies Prisma.UserSelect

	private getChansSelect = (username: string) => ({
		id: true,
		title: true,
		type: true,
		ownerName: true,
		users: {
            select: {
                ...this.usersService.getProximityLevelSelect(username),
                statusVisibilityLevel: true,
                name: true
            }
        },
		roles: {
            where: { users: { some: { name: username } } },
            select: { permissions: true }
        }
	} satisfies Prisma.ChanSelect)

    // TODO check this shit
    public getDoesUserHasSelfPermSelect = (username: string,
        perm: z.infer<typeof zSelfPermissionList>
    ) => ({
        roles: {
            select: {
                users: {
                    where: { name: username },
                    select: { name: true }
                },
                permissions: true,
            },
            take: 1,
        },
        ownerName: true,
        ...(perm === 'SEND_MESSAGE'
            ? {
                mutedUsers: {
                    where: { mutedUserName: username },
                    take: 1,
                    select: { id: true, untilDate: true }
                }
            }
            : {})   
    } satisfies Prisma.ChanSelect)

    public getDoesUserHasPermOverUserSelect = (username: string,
        perm: Exclude<PermissionList, z.infer<typeof zSelfPermissionList>>
    ) => ({
            roles: {
                select: {
                    permissions: true,
                    users: { select: { name: true } },
                    roleApplyOn: true,
                    roles: { select: { users: { select: { name: true } } } }
                },
            },
            ownerName: true,
    } satisfies Prisma.ChanSelect)

	private chanDiscussionEventsSelect = {
		concernedUserName: true,
		classicChanDiscussionEvent: { select: { eventType: true } },
		changedTitleChanDiscussionEvent: { select: { oldTitle: true, newTitle: true } },
		deletedMessageChanDiscussionEvent: { select: { deletingUserName: true } },
	} satisfies Prisma.ChanDiscussionEventSelect

	private chanDiscussionMessagesSelect = {
		content: true,
		related: {
            select: {
                id: true,
                authorName: true,
                message: { select: { content: true } },
                event: { select: this.chanDiscussionEventsSelect }
            }
        },
		relatedUsers: { select: { name: true } },
		relatedRoles: { select: { name: true } },
        modificationDate: true
	} satisfies Prisma.ChanDiscussionMessageSelect

	private chanDiscussionElementsSelect = {
		id: true,
		event: { select: this.chanDiscussionEventsSelect },
		message: { select: this.chanDiscussionMessagesSelect },
		authorName: true,
		creationDate: true,
	} satisfies Prisma.ChanDiscussionElementSelect

	private defaultPermissions: (typeof PermissionList)[keyof typeof PermissionList][] = [
		"INVITE",
		"SEND_MESSAGE",
		"DELETE_MESSAGE",
	]

	private adminPermissions: (typeof PermissionList)[keyof typeof PermissionList][] = [
		"KICK",
		"BAN",
		"MUTE",
		"DELETE_MESSAGE",
	]

	private namesArrayToStringArray(users: { name: string }[]) {
		return users.map((el) => el.name)
	}

    private formatChanUser = (
        user: ChanPayload['users'][number]
    ) => ({
            name: user.name,
            status: this.usersService.getUserStatusByProximity(
                user.name,
                this.usersService.getProximityLevel(user),
                user.statusVisibilityLevel)
        } as const)

	private formatChan(chan: ChanPayload) {
		const { roles, users, ...rest } = chan
        const formattedUsers = users.map(el => this.formatChanUser(el))
        const selfPerms = [...new Set(roles
            .flatMap(el => el.permissions
                .filter((el): el is z.infer<typeof zSelfPermissionList> =>
                    // may perform better, but do we really care ?
                    // (zSelfPermissionList.options as string[]).includes(el)
                    zSelfPermissionList.safeParse(el).success)
        ))]
		return {
			...rest,
			users: formattedUsers,
            selfPerms
		}
	}

	private formatChanArray = (chans: ChanPayload[]) =>
		chans.map((chan) => this.formatChan(chan))

	private formatChanDiscussionMessageForUser(
        username: string,
        element: Omit<ChanDiscussionElementPayload, "event" | "message">
            & (
                ({ message: ChanDiscussionMessagePayload, event: null})
                | ({ event: Extract<
                            ChanRetypedEvent<ChanDiscussionEventPayload>,
                            { deletedMessageChanDiscussionEvent: {} }
                        >,
                     message: null
                  })
            ),
	) {
        if (element.event) {
            const { event: { deletedMessageChanDiscussionEvent: { deletingUserName } }, authorName: author, ...elementRest } = element
            return {
                ...elementRest,
                isDeleted: true,
                author,
                content: "",
                deletingUserName,
                type: 'message',
            } as const
        }
        const { message, authorName: author, ...elementRest } = element
		const { relatedRoles, relatedUsers, related, ...messageRest } = message

        return {
            ...elementRest,
            author,
            isDeleted: false,
            relatedTo: related && {
                id: related.id,
                // TODO this is just for testing purpose, do something cleaner if tom likes preview
                preview: (() => {
                    if (related.event) {
                        const retypedRelatedEvent = related.event as ChanRetypedEvent<typeof related.event>
                        if (retypedRelatedEvent.deletedMessageChanDiscussionEvent)
                            return { type: 'message', isDeleted: true } as const
                        else if (retypedRelatedEvent.changedTitleChanDiscussionEvent)
                            return { type: 'event', eventType: "CHANGED_TITLE" } as const
                        else
                            return { type: 'event', eventType: retypedRelatedEvent.classicChanDiscussionEvent.eventType } as const
                    }
                    return { type: 'message', isDeleted: false, content: related.message?.content || "" } as const
                })()
            },
            ...messageRest,
            mentionMe: !!(this.namesArrayToStringArray(relatedRoles.concat(relatedUsers))
                    .includes(username)
                || (related?.authorName === username)
                || (related?.event?.concernedUserName === username)),
            hasBeenEdited: (element.creationDate.getTime() !==
                element.message.modificationDate.getTime()),
            type: 'message'
        } as const
	}

	private formatChanDiscussionEvent(
        username: string,
        element: Omit<ChanDiscussionElementPayload, "event" | "message">
            & {
                event: Extract<
                    ChanRetypedEvent<ChanDiscussionEventPayload>,
                    { deletedMessageChanDiscussionEvent: null }
                >
            }
	) {
        const { event, authorName: author, ...elementRest } = element
        const {
            deletedMessageChanDiscussionEvent,
            changedTitleChanDiscussionEvent,
            classicChanDiscussionEvent,
            concernedUserName,
            ...eventRest
        } = event
        if (changedTitleChanDiscussionEvent) {
            return {
                ...elementRest,
                ...eventRest,
                author,
                ...changedTitleChanDiscussionEvent,
                eventType: "CHANGED_TITLE",
                type: 'event'
            } as const
        }
        return {
            ...elementRest,
            ...eventRest,
            concernedUserName,
            concernMe: concernedUserName === username,
            author,
            ...classicChanDiscussionEvent,
            type: 'event'
        } as const
	}

	private formatChanDiscussionElementForUser(
        username: string,
		element: ChanRetypedElementTest<ChanDiscussionElementPayload>
	): z.infer<typeof zChanDiscussionElementReturn> {
        const { event } = element;
        if (event?.deletedMessageChanDiscussionEvent)
            return this.formatChanDiscussionMessageForUser(username, { ...element, event});
        if (event)
            return this.formatChanDiscussionEvent(username, { ...element, event });
        return this.formatChanDiscussionMessageForUser(username, element);
	}

	private formatChanDiscussionElementArrayForUser(
        username: string,
		elements: ChanRetypedElementTest<ChanDiscussionElementPayload>[],
	) {
		return elements.map(element =>
            this.formatChanDiscussionElementForUser(username, element))
	}

	async getUserChans(username: string) {
		return this.formatChanArray(
			await this.prisma.chan.findMany({
				where: {
					users: { some: { name: username } },
				},
				select: this.getChansSelect(username),
				orderBy: { type: "desc" },
			}),
		)
	}

	async createChan(username: string, chan: RequestShapes["createChan"]["body"]) {
		if (chan.type === "PUBLIC" && chan.password)
            chan.password = await hash(chan.password, 10)
        if (chan.title && await this.getChan({ title: chan.title }, { id: true }))
            return contractErrors.ChanAlreadyExist(chan.title)
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
            select: this.getChansSelect(username),
        })
        await this.prisma.role.update({
            where: { chanId_name: { chanId: res.id, name: "ADMIN" } },
            data: {
                roles: { connect: { chanId_name: { chanId: res.id, name: "DEFAULT" } } },
            },
        })
        return this.formatChan(res)
	}

    public async doesUserHasSelfPermInChan(
        username: string,
        perm: z.infer<typeof zSelfPermissionList>,
        { ownerName, roles, mutedUsers }: DoesUserHasSelfPermPayload
    ) {
        if (perm === 'SEND_MESSAGE' && mutedUsers?.length
            && !(await this.removeMutedIfUntilDateReached(mutedUsers[0]))) {
            return false 
        }
        return !!(username === ownerName 
            || roles.some(el => el.users.map(el => el.name).includes(username)
                && el.permissions.includes(perm)))
    }

    public doesUserHasPermOverUserInChan(username: string,
        otherUserName: string,
        { roles, ownerName }: DoesUserHasPermOverUserPayload,
        perm: Exclude<PermissionList, z.infer<typeof zSelfPermissionList>>
    ) {
        if (username === otherUserName || username === ownerName)
            return true
        if (roles.some(role => {
            if ((role.roleApplyOn === 'NONE')
                || (role.users.every(user => user.name !== username))
                || (role.permissions.every(el => el !== perm))
            )
                return false
            if (role.roles.some(el => el.users.some(el => el.name === otherUserName ))
                && role.users.every(user => user.name !== otherUserName)
            )
                return true
            if (role.roleApplyOn === 'ROLES_AND_SELF'
                && role.users.some(user => user.name === otherUserName)
            )
                return true
            return false
        }))
            return true
    }

	async deleteChan(username: string, chanId: string) {
        
        const chan = await this.getChan({ id: chanId, users: { some: { name: username } } },
            {
                ...this.getDoesUserHasSelfPermSelect(username, 'DESTROY'),
                users: { select: { name: true } }
            })
        if (!chan)
            return contractErrors.NotFoundChan(chanId)
        if (!await this.doesUserHasSelfPermInChan(username, 'DESTROY', chan))
            return contractErrors.ChanPermissionTooLow(username, chanId, 'DESTROY')
		await this.prisma.chan.delete({ where: { id: chanId } })
        this.chanInvitationsService.updateAndNotifyManyInvsStatus(
            ChanInvitationStatus.DELETED_CHAN,
            { chanId })
        this.sse.pushEventMultipleUser(chan.users.map(el => el.name),
            {
                type: 'DELETED_CHAN',
                data: { chanId }
            })
        return null
	}

	async leaveChan(username: string, chanId: string) {
		const chan = await this.getChan({ id: chanId, users: { some: { name: username } } },
			{ ownerName: true })
        if (!chan)
            return contractErrors.NotFoundChan(chanId)
		if (username === chan.ownerName)
            return contractErrors.OwnerCannotLeaveChan()
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
        return null
	}

	async createChanMessage(
		username: string,
		chanId: string,
		content: string,
		relatedTo: string | undefined,
        ats: { users: { name: string }[], roles: { name: string }[] }
	) {
		return (
            await this.prisma.chanDiscussionMessage.create({
				data: {
					content: content,
					related: relatedTo ? { connect: { id: relatedTo } } : undefined,
					relatedUsers: { connect: ats.users },
					relatedRoles: {
                        connect: ats.roles.map(role => ({ chanId_name: { chanId, ...role } }))
                    },
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
	}

	public async removeMutedIfUntilDateReached(state: { id: string; untilDate: Date | null }) {
		if (!state.untilDate || new Date() < state.untilDate)
            return false
		await this.prisma.mutedUserChan.delete({ where: { id: state.id },
            select: { id: true } })
		return true
	}

    getAtsFromChanMessageContent(chan: {
            users: { name: string }[],
            roles: { name: string }[]
        },
        content: string
    ) {
        const uncheckedAts = content.split(' ')
            .filter(el => el.startsWith("@"))
            .flatMap(el => el.split('@'))
        return {
            users: chan.users
                .filter(user => uncheckedAts.includes(user.name)),
            roles: chan.roles
                .filter(role => uncheckedAts.includes(role.name))
        }
    }

	async createChanMessageIfRightTo(
		username: string,
		chanId: string,
        { relatedTo, content }: RequestShapes["createChanMessage"]["body"],
	) {
        const chan = await this.getChan({ id: chanId, users: { some: { name: username } } },
            {
                ...this.getDoesUserHasSelfPermSelect(username, 'SEND_MESSAGE'),
                users: { select: { name: true } },
                roles: {
                    select: {
                        ...(this.getDoesUserHasSelfPermSelect(username, 'SEND_MESSAGE')
                            .roles.select),
                        name: true
                    }
                },
                ...(relatedTo
                    ? { elements: { where: { id: relatedTo }, select: { id: true } } }
                    : {})
            })
        if (!chan)
            return contractErrors.NotFoundChan(chanId)
        if (!await this.doesUserHasSelfPermInChan(username, 'SEND_MESSAGE', chan))
            return contractErrors.ChanPermissionTooLow(username, chanId, 'SEND_MESSAGE')
        if (relatedTo && !chan.elements?.length)
            return contractErrors.NotFoundChanRelatedToElement(chanId, relatedTo)
        const ats = this.getAtsFromChanMessageContent(chan, content)
		const newMessage = await this.createChanMessage(username, chanId, content,
			relatedTo, ats)
		if (!newMessage || !newMessage.message)
            return contractErrors.ContentModifiedBetweenCreationAndRead('ChanMessage')
        const { message } = newMessage
        chan.users.forEach(({ name }) => {
            this.sse.pushEvent(name, {
                type: 'CREATED_CHAN_ELEMENT',
                data: {
                    chanId,
                    element: this.formatChanDiscussionMessageForUser(name,
                        { ...newMessage, message, event: null })
                }
            })
        })
        return this.formatChanDiscussionMessageForUser(username,
            { ...newMessage, message, event: null })
	}

	async getChanElements(username: string, chanId: string, { nElements, cursor }: RequestShapes['getChanElements']['query']) {
		const chan = await this.getChan(
			{ id: chanId, users: { some: { name: username } } },
			{
				elements: {
					cursor: cursor ? { id: cursor } : undefined,
					orderBy: { creationDate: "desc" },
					take: nElements,
					select: this.chanDiscussionElementsSelect,
					skip: Number(!!cursor),
				},
			},
		)
        if (!chan)
            return contractErrors.NotFoundChan(chanId)
		return this.formatChanDiscussionElementArrayForUser(username, chan.elements.reverse())
	}

    async updateChanMessage(username: string,
        { chanId, elementId }: RequestShapes['updateChanMessage']['params'],
        content: string
    ) {
        const chan = await this.getChan({ id: chanId, users: { some: { name: username } } },
            {
                ...this.getDoesUserHasSelfPermSelect(username, 'SEND_MESSAGE'),
                users: { select: { name: true } },
                roles: {
                    select: {
                        ...(this.getDoesUserHasSelfPermSelect(username, 'SEND_MESSAGE')
                            .roles.select),
                        name: true
                    }
                },
                elements: {
                    where: { id: elementId, message: { isNot: null } },
                    select: {
                        authorName: true,
                        message: {
                            select: {
                                relatedUsers: { select: { name: true } },
                                relatedRoles: { select: { name: true } }
                            }
                        }
                    }
                }
            })
        if (!chan)
            return contractErrors.NotFoundChan(chanId)
        if (!chan.elements.length || !chan.elements[0].message)
            return contractErrors.NotFoundChanMessage(chanId, elementId)
        const oldMessage = chan.elements[0].message
        if (!await this.doesUserHasSelfPermInChan(username, 'SEND_MESSAGE', chan))
            return contractErrors.ChanPermissionTooLow(username, chanId, 'SEND_MESSAGE')
        if (chan.elements[0].authorName !== username)
            return contractErrors.NotOwnedChanMessage(username, 'update', elementId, chanId)
        const ats = this.getAtsFromChanMessageContent(chan, content)
        const updatedElement = await this.prisma.chanDiscussionElement.update({
            where: { id: elementId, message: { isNot: null } },
            data: {
                message: {
                    update: {
                        content: content,
                        relatedUsers: {
                            connect: ats.users
                                .filter(el => oldMessage.relatedUsers.every(user => user.name !== el.name)),
                            disconnect: oldMessage.relatedUsers
                                .filter(user => ats.users.every(el => el.name !== user.name))
                        },
                        relatedRoles: {
                            connect: ats.roles
                                .filter(el => oldMessage.relatedRoles.every(role => role.name !== el.name))
                                .map(el => ({ chanId_name: { chanId, ...el } })),
                            disconnect: oldMessage.relatedRoles
                                .filter(role => ats.roles.every(el => el.name !== role.name))
                                .map(el => ({ chanId_name: { chanId, ...el } }))
                        }
                    }
                }
            },
            select: this.chanDiscussionElementsSelect
        })
        const { message } = updatedElement
        if (!message)
            return contractErrors.ContentModifiedBetweenUpdateAndRead('ChanMessage')
        chan.users.forEach(({ name }) => {
            this.sse.pushEvent(name, {
                type: 'UPDATED_CHAN_MESSAGE',
                data: {
                    chanId,
                    message: this.formatChanDiscussionMessageForUser(name,
                        { ...updatedElement, message, event: null })
                }
            })
        })
        return this.formatChanDiscussionMessageForUser(username,
            { ...updatedElement, message, event: null })
    }

    private async deleteChanMessage(elementId: string, deletingUserName: string) {
        const deletedElement = await this.prisma.chanDiscussionElement.update({
			where: { id: elementId, message: { isNot: null } },
			data: {
				event: {
					create: {
						deletedMessageChanDiscussionEvent: {
							create: { deletingUserName },
						},
					},
				},
                message: { delete: {} }
			},
            select: this.chanDiscussionElementsSelect
		})
        const retypedDeletedElement = deletedElement as ChanRetypedElementTest<typeof deletedElement>
        if (!retypedDeletedElement.event?.deletedMessageChanDiscussionEvent)
            return contractErrors.ContentModifiedBetweenUpdateAndRead('ChanMessage')
        return { ...retypedDeletedElement, event: retypedDeletedElement.event } as const
    }

	async deleteChanMessageIfRightTo(username: string, { chanId , elementId }: RequestShapes['deleteChanMessage']['params']) {
        const chan = await this.getChan({ id: chanId, users: { some: { name: username } } },
            {
                ...this.getDoesUserHasPermOverUserSelect(username, 'DELETE_MESSAGE'),
                elements: {
                    where: { id: elementId, message: { isNot: null } },
                    select: { authorName: true }
                },
                users: { select: { name: true } }
            })
        if (!chan)
            return contractErrors.NotFoundChan(chanId)
        if (!chan.elements.length)
            return contractErrors.NotFoundChanMessage(chanId, elementId)
        const { authorName } = chan.elements[0]
        if (!this.doesUserHasPermOverUserInChan(username, authorName, chan, 'DELETE_MESSAGE'))
            return contractErrors.ChanPermissionTooLowOverUser(username, authorName, chanId, 'DELETE_MESSAGE')
		const deletedElement = await this.deleteChanMessage(elementId, username)
        if (isContractError(deletedElement))
            return deletedElement
        chan.users.filter(user => user.name !== username).forEach(({ name }) => {
            this.sse.pushEvent(name, {
                type: 'UPDATED_CHAN_MESSAGE',
                data: {
                    chanId,
                    message: this.formatChanDiscussionMessageForUser(name, deletedElement)
                }
            })
        })
        return this.formatChanDiscussionMessageForUser(username, deletedElement)
	}

	// async kickUserFromChan(username: string, toKickUserName: string, chanId: string) {
	// 	await this.throwIfUserNotAuthorizedOverUserInChan(
	// 		username,
	// 		toKickUserName,
	// 		chanId,
	// 		PermissionList.KICK,
	// 	)
	// 	const res = this.formatChan(
	// 		await this.prisma.chan.update({
	// 			where: { id: chanId },
	// 			data: { users: { disconnect: { name: toKickUserName } } },
	// 			select: this.chansSelect,
	// 		}),
	// 	)

	// 	// PRISMA SUCK
	// 	const roles = (
	// 		await this.prisma.role.findMany({
	// 			where: { chanId, users: { some: { name: toKickUserName } } },
	// 			select: { id: true },
	// 		})
	// 	).map((role) => role.id)
	// 	await Promise.all(
	// 		roles.map(async (id) =>
	// 			this.prisma.role.update({
	// 				where: { id },
	// 				data: { users: { disconnect: { name: toKickUserName } } },
	// 			}),
	// 		),
	// 	)

	// 	return Promise.all([
	// 		this.notifyChan(chanId, { type: "UPDATED_CHAN", data: res }, null),
	// 		this.createAndNotifyClassicChanEvent(
	// 			username,
	// 			toKickUserName,
	// 			chanId,
	// 			ClassicChanEventType.AUTHOR_KICKED_CONCERNED,
	// 		),
	// 		this.sse.pushEvent(toKickUserName, { type: "KICKED_FROM_CHAN", data: { chanId } }),
	// 	])
	// }

	public async createAndNotifyClassicChanEvent(
		author: string,
		concerned: string | null,
		chanId: string,
		event: (typeof ClassicChanEventType)[keyof typeof ClassicChanEventType],
	) {
		const newEvent = (
			await this.prisma.chanDiscussionEvent.create({
				data: {
					classicChanDiscussionEvent: {
						create: { eventType: event },
					},
					...(concerned
                        ? { concernedUser: { connect: { name: concerned } } }
                        : {}),
					discussionElement: {
						create: {
							chan: { connect: { id: chanId } },
							author: { connect: { name: author } },
						},
					},
				},
				select: {
                    discussionElement: {
                        select: {
                            ...this.chanDiscussionElementsSelect,
                            chan: { select: { users: { select: { name: true } } } }
                        }
                    }
                },
			})
		).discussionElement
		if (!newEvent)
            return
        newEvent.chan.users.forEach(({ name }) => {
            this.sse.pushEvent(name, {
                type: "CREATED_CHAN_ELEMENT",
                data: {
                    chanId,
                    element: this.formatChanDiscussionElementForUser(name,
                        newEvent as ChanRetypedElementTest<typeof newEvent>)
                }
            })
        });
	}

	public async pushUserToChanAndNotifyUsers(username: string, chanId: string) {
		const newChan = await this.prisma.chan.update({
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
            select: this.getChansSelect(username),
        })

        const newUser = newChan.users.find(el => el.name === username)
        if (!newUser)
            return contractErrors.ContentModifiedBetweenCreationAndRead('ChanUser')

        newChan.users.filter(el => el.name !== username).forEach(el => {
            const { name, statusVisibilityLevel, ...rest } = el
            this.sse.pushEvent(name,
                {
                    type: "CREATED_CHAN_USER",
                    data: this.formatChanUser({
                        ...rest,
                        name: username,
                        statusVisibilityLevel: newUser.statusVisibilityLevel
                    })
                })
        })
		setTimeout(
			this.createAndNotifyClassicChanEvent.bind(this),
			0,
			username,
			null,
			chanId,
			ClassicChanEventType.AUTHOR_JOINED,
		)
		return this.formatChan(newChan)
	}

	public getChan = async <Sel extends Prisma.ChanSelect>(
		where: Prisma.ChanWhereUniqueInput,
		select: Prisma.Subset<Sel, Prisma.ChanSelect>,
	) => {
        type RetypedChan<T> = T extends Record<"elements", any[]>
            ? Omit<T, "elements">
                & Record<"elements", ChanRetypedElementTest<T['elements'][number]>[]>
            : T
        const chan = await this.prisma.chan.findUnique({ where, select })
        
        return chan as RetypedChan<typeof chan>
    }

	async joinChanById(username: string, { chanId, password }: RequestShapes['joinChanById']['body']) {
		const res = await this.getChan(
			{
				id: chanId,
				type: ChanType.PUBLIC,
			},
			{
				password: true,
				users: { where: { name: username }, select: { name: true } },
                // TODO check for ban here
			}
		)
        if (!res)
            return contractErrors.NotFoundChan(chanId)
        const { password: chanPassword, users } = res
		if (users.length)
            return contractErrors.ChanUserAlreadyExist(username, chanId)
		if (password && !chanPassword)
            return contractErrors.ChanDoesntNeedPassword(chanId)
		if (!password && chanPassword)
            return contractErrors.ChanNeedPassword(chanId)
		if (chanPassword && password && !compareSync(password, chanPassword))
            return contractErrors.ChanWrongPassword(chanId)
        await this.chanInvitationsService
            .updateAndNotifyManyInvsStatus('ACCEPTED', { chanId, invitedUserName: username })
		return this.pushUserToChanAndNotifyUsers(username, chanId)
	}

	async searchChans({ titleContains, nResult }: RequestShapes['searchChans']['query']) {
		const res = await this.prisma.chan.findMany({
			where: {
				type: ChanType.PUBLIC,
				title: { contains: titleContains, not: null },
			},
			select: {
                id: true,
                title: true,
                _count: { select: { users: true } },
                password: true,
            },
			take: nResult,
			orderBy: { title: "asc" },
		})
		return res.map((el) => {
			const passwordProtected: boolean = !!el.password
			const { password, _count, title, ...trimmedEl } = el
			return {
                passwordProtected,
                nUsers: _count.users,
                // TODO ref commit: <8353f0dbf75bc37502d97e2c6d01001113874b5d> 
                title: title as Exclude<typeof title, null>,
                // TODO change this when ban features is available
                bannedMe: false,
                ...trimmedEl
            }
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
