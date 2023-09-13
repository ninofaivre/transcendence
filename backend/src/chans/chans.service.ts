import { Inject, Injectable, forwardRef } from "@nestjs/common"
import {
	ChanType,
	PermissionList,
	Prisma,
	ChanInvitationStatus,
    TimedStatusType
} from "@prisma/client"
import { compareSync, hash } from "bcrypt"
import { SseService } from "src/sse/sse.service"
import { NestRequestShapes } from "@ts-rest/nest"
import { adminPermissions, contract, contractErrors, isContractError } from "contract"
import { zChanDiscussionElementReturn } from "contract"
import { z } from "zod"
import { ChanInvitationsService } from "src/invitations/chan-invitations/chan-invitations.service"
import { PrismaService } from "src/prisma/prisma.service"
import { UserService } from "src/user/user.service"
import { zSelfPermissionList } from "contract"
import { ChanElementUnion, EnrichedRequest, RetypeChanElement } from "src/types"
import { zPermissionOverList } from "contract"
import { CallbackService } from "src/callback/callback.service"
import { ChanElementFactory, UpdateChanElementFactory } from "./element"
import { defaultPermissions } from "contract"

type RequestShapes = NestRequestShapes<typeof contract.chans>

export type ChanDiscussionElementPayload = RetypeChanElement<Prisma.ChanDiscussionElementGetPayload<
    { select: ChansService['chanDiscussionElementsSelect'] }>>

type ChanDiscussionElementEventPayload = Extract<ChanDiscussionElementPayload, { event: {} }>
type ChanDiscussionElementMessagePayload = Extract<ChanDiscussionElementPayload, { message: {} }>
export type ChanDiscussionElementEventWithoutDeletedPayload =
    Omit<ChanDiscussionElementEventPayload, "event">
    & {
        event: Exclude<ChanDiscussionElementEventPayload['event'],
            { deletedMessageChanDiscussionEvent: {} }>
    }
export type ChanDiscussionElementMessageWithDeletedPayload =
    | ChanDiscussionElementMessagePayload
    | (
        Omit<ChanDiscussionElementEventPayload, "event">
        & {
            event: Extract<ChanDiscussionElementEventPayload['event'],
                { deletedMessageChanDiscussionEvent: {} }>
        }
    )

type ChanPayload = Prisma.ChanGetPayload<
    { select: ReturnType<ChansService['getChansSelect']> }>
type SelfPermPayload = Prisma.ChanGetPayload<
    { select: ReturnType<ChansService['getSelfPermSelect']> }>
type PermPayload = Prisma.ChanGetPayload<
    { select: ReturnType<ChansService['getPermSelect']> }>

@Injectable()
export class ChansService {

    private getTimedChanUsersByStatus = (type?: TimedStatusType) => ({
        type,
        OR: [
            { untilDate: { gt: new Date() } },
            { untilDate: null }
        ]
    } satisfies Prisma.Chan$timedStatusUsersArgs['where'])

    private async endTimedStatusUserInChan<Select extends Prisma.ChanSelect>(
        username: string, chanId: string,
        type: TimedStatusType, select: Prisma.Subset<Select, Prisma.ChanSelect>
    ) {
        this.callbackService.deleteCallback(username, `UN${type}`)
        const res = await this.prisma.chan.update({ where: { id: chanId },
            data: {
                timedStatusUsers: {
                    updateMany: {
                        where: {
                            timedUserName: username,
                            ...this.getTimedChanUsersByStatus(type)
                        },
                        data: { untilDate: new Date() }
                    }
                }
            },
            select })
        return res
    }

    constructor(
		public readonly prisma: PrismaService,
		public readonly sse: SseService,
		@Inject(forwardRef(() => UserService))
		private readonly usersService: UserService,
		@Inject(forwardRef(() => ChanInvitationsService))
		private readonly chanInvitationsService: ChanInvitationsService,
        private readonly callbackService: CallbackService
	) {
        this.prisma.chan.findMany({
            where: { timedStatusUsers: { some: this.getTimedChanUsersByStatus('MUTE') } },
            select: {
                id: true,
                timedStatusUsers: {
                    where: this.getTimedChanUsersByStatus(),
                    select: {
                        untilDate: true,
                        timedUserName: true,
                        type: true
                    }
                }
            }})
            .then(chans => {
                const currentDateMs = (new Date()).getTime()
                chans.forEach(({ id: chanId, timedStatusUsers }) => {
                    timedStatusUsers.forEach(({ type, timedUserName, untilDate }) => {
                        if (!untilDate)
                            return
                        const timeoutId = setTimeout(
                            (type === 'MUTE'
                                ? this.unmuteUser.bind(this)
                                : this.unbanUser.bind(this)),
                            untilDate.getTime() - currentDateMs,
                            timedUserName, chanId)
                        this.callbackService.setCallback(timedUserName,
                            `UN${type}`,
                            timeoutId)
                    })
                })
            })
    }

	private getChansSelect = (username: string) => ({
		id: true,
		title: true,
		type: true,
		users: {
            select: {
                ...this.usersService.getProximityLevelSelect(username),
                statusVisibilityLevel: true,
                name: true,
                displayName: true
            }
        },
		...this.getPermSelect(),
        password: true
	} satisfies Prisma.ChanSelect)

    private timedStatusUserChanSelect = {
        untilDate: true,
        timedUserName: true,
        timedUser: { select: { displayName: true } },
        type: true
    } satisfies Prisma.TimedStatusUserChanSelect

    private permSelectBase = (...usernames: string[]) => ({
        timedStatusUsers: {
            where: {
                ...(usernames.length ? { timedUserName: { in: usernames } }: {}),
                ...this.getTimedChanUsersByStatus()
            },
            select: this.timedStatusUserChanSelect
        },
        ownerName: true
    } as const satisfies Prisma.ChanSelect)

    private rolePermSelectBase = {
        users: { select: { name: true } },
        permissions: true,
        name: true
    } as const satisfies Prisma.RoleSelect

    public getSelfPermSelect = (...usernames: string[]) => ({
        ...this.permSelectBase(...usernames),
        roles: {
            ...(usernames.length
                ? {
                    where: {
                        users: {
                            some: {
                                name: { in: usernames }
                            }
                        }
                    }
                }
                : {}),
            select: this.rolePermSelectBase
        }
    } as const satisfies Prisma.ChanSelect)

    public getPermSelect = (...usernames: string[]) => ({
        ...this.permSelectBase(...usernames),
        roles: {
            ...(usernames.length
                ? {
                    where: { users: { some: { name: { in: usernames } } } },
                }
                : {}),
            select: {
                ...this.rolePermSelectBase,
                roles: {
                    select: {
                        users: { select: { name: true } },
                        name: true }
                },
            }
        }
    } as const satisfies Prisma.ChanSelect)

	private chanDiscussionEventsSelect = {
		concernedUserName: true,
        concernedUser: { select: { displayName: true } },
		classicChanDiscussionEvent: { select: { eventType: true } },
        mutedUserChanDiscussionEvent: { select: { mutedUserName: true, mutedUser: { select: { displayName: true } }, timeoutInMs: true } },
		changedTitleChanDiscussionEvent: { select: { oldTitle: true, newTitle: true } },
		deletedMessageChanDiscussionEvent: { select: { deletingUserName: true, deletingUsers: { select: { displayName: true } } } },
	} satisfies Prisma.ChanDiscussionEventSelect

	private chanDiscussionMessagesSelect = {
		content: true,
		relatedUsers: { select: { name: true } },
		relatedRoles: { select: { name: true } },
        modificationDate: true
	} satisfies Prisma.ChanDiscussionMessageSelect


	public chanDiscussionElementsSelectBase = {
		id: true,
		event: { select: this.chanDiscussionEventsSelect },
		message: { select: this.chanDiscussionMessagesSelect },
        author: {
            select: {
                blockedByUser: {
                    select: { blockingUserName: true }
                },
                displayName: true
            }
        },
		authorName: true,
		creationDate: true,
	} satisfies Prisma.ChanDiscussionElementSelect

	public chanDiscussionElementsSelect = {
        ...this.chanDiscussionElementsSelectBase,
        message: {
            select: {
                ...this.chanDiscussionElementsSelectBase['message']['select'],
                related: { select: this.chanDiscussionElementsSelectBase }
            }
        }
	} satisfies Prisma.ChanDiscussionElementSelect

    private formatChanUserForUser = (
        username: string,
        user: ChanPayload['users'][number],
        permPayload: PermPayload
    ) => ({
            name: user.name,
            displayName: user.name,
            status: this.usersService.getUserStatusByProximity(
                user.name,
                this.usersService.getProximityLevel(user),
                user.statusVisibilityLevel),
            roles: permPayload.roles
                .filter(role => role.users.some(el => el.name === user.name))
                .map(role => role.name),
            myPermissionOver: this.getPermOverUserInChan(username, user.name, permPayload)
        } as const)

    private isSelfPerm = (perm: PermissionList)
    : perm is z.infer<typeof zSelfPermissionList> => !this.isPermOver(perm)

    private notifyUpdatedSelfPerm = (
        username: string,
        payload: SelfPermPayload & { id: string }
    ) => (this.sse.pushEvent(username, {
        type: 'UPDATED_CHAN_SELF_PERMS',
        data: {
            chanId: payload.id,
            selfPerms: this.getSelfPerm(username, payload)
        }
    }))

    private getSelfPerm(
        username: string,
        { ownerName, roles, timedStatusUsers }: SelfPermPayload
    ) {
        if (username === ownerName)
            return zSelfPermissionList.options
        const perms = [...new Set(roles
            .filter(role => role.users.some(user => user.name === username))
            .flatMap(role => role.permissions)
            .filter(this.isSelfPerm))]
        if (timedStatusUsers.some(user => user.timedUserName === username)) {
            return perms 
                .filter(perm => (perm !== 'SEND_MESSAGE' && perm !== 'UPDATE_MESSAGE'))
        }
        return perms
    }

	private formatChan(username: string, chan: ChanPayload) {
		const { password, roles, users, timedStatusUsers, ...rest } = chan
		return {
            ...rest,
            roles: roles.map(role => role.name),
            passwordProtected: !!password,
            selfPerms: this.getSelfPerm(username, chan),
            users: users.map(user =>
                this.formatChanUserForUser(username, user, chan),
            )
		}
	}

	private formatChanArray = (username: string, chans: ChanPayload[]) =>
		chans.map((chan) => this.formatChan(username, chan))

	public formatChanDiscussionMessageForUser(
        username: string,
        element: ChanDiscussionElementMessageWithDeletedPayload
	) {
        if (element.event) {
            const { event: { deletedMessageChanDiscussionEvent: { deletingUserName, deletingUsers: { displayName: deletingDisplayName } } }, authorName: author, author: { displayName: authorDisplayName }, ...elementRest } = element
            return {
                ...elementRest,
                isDeleted: true,
                isAuthorBlocked: element.author.blockedByUser.some(el => el.blockingUserName === username),
                author,
                authorDisplayName,
                content: "",
                deletingUserName,
                deletingDisplayName,
                type: 'message',
            } as const
        }
        const { message, authorName: author, author: { displayName }, ...elementRest } = element
		const { relatedRoles, relatedUsers, related, ...messageRest } = message

        return {
            ...elementRest,
            author,
            authorDisplayName: displayName,
            isDeleted: false,
            isAuthorBlocked: element.author.blockedByUser.some(el => el.blockingUserName === username),
            relatedTo: related && this.formatChanDiscussionElementForUser(username, (related.message) ? { ...related, message: { ...related['message'], related: null } } : related),
            ...messageRest,
            mentionMe: !!(this.usersToNames(relatedRoles.concat(relatedUsers))
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
        element: ChanDiscussionElementEventWithoutDeletedPayload
    ) {
        const { event, authorName: author, author: { displayName: authorDisplayName }, ...elementRest } = element
        const {
            deletedMessageChanDiscussionEvent,
            changedTitleChanDiscussionEvent,
            mutedUserChanDiscussionEvent,
            classicChanDiscussionEvent,
            concernedUserName,
            concernedUser,
            ...eventRest
        } = event
        if (changedTitleChanDiscussionEvent) {
            return {
                ...elementRest,
                ...eventRest,
                author,
                authorDisplayName,
                ...changedTitleChanDiscussionEvent,
                eventType: "CHANGED_TITLE",
                type: 'event'
            } as const
        }
        else if (mutedUserChanDiscussionEvent) {
            const { mutedUserName, mutedUser: { displayName: concernedDisplayName }, timeoutInMs } = mutedUserChanDiscussionEvent
            return {
                ...elementRest,
                ...eventRest,
                author,
                authorDisplayName,
                concernedUserName: mutedUserName,
                concernedDisplayName,
                concernMe: concernedUserName === username,
                timeoutInMs: timeoutInMs || 'infinity',
                eventType: "AUTHOR_MUTED_CONCERNED",
                type: 'event'
            } as const
        }
        return {
            ...elementRest,
            ...eventRest,
            concernedUserName,
            concernedDisplayName: concernedUser?.displayName || null,
            concernMe: concernedUserName === username,
            author,
            authorDisplayName,
            ...classicChanDiscussionEvent,
            type: 'event'
        } as const
	}

	public formatChanDiscussionElementForUser(
        username: string,
		element: ChanDiscussionElementPayload
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
		elements: ChanDiscussionElementPayload[],
	) {
		return elements.map(element =>
            this.formatChanDiscussionElementForUser(username, element))
	}

	async getUserChans(username: string) {
		return this.formatChanArray(username,
			await this.prisma.chan.findMany({
				where: {
					users: { some: { name: username } },
				},
				select: this.getChansSelect(username),
                orderBy: { creationDate: 'desc' }
			}),
		)
	}

	async createChan({ username, sseId }: EnrichedRequest['user'], chan: RequestShapes["createChan"]["body"]) {
		if (chan.type === "PUBLIC" && chan.password)
            chan.password = await hash(chan.password, 10)
        if (chan.title && await this.getChan({ title: chan.title }, { id: true }))
            return contractErrors.ChanAlreadyExist(chan.title)
        const newChan = await this.prisma.chan.create({
            data: {
                ...chan,
                owner: { connect: { name: username } },
                users: { connect: { name: username } },
                roles: {
                    createMany: {
                        data: [
                            {
                                name: "DEFAULT",
                                permissions: defaultPermissions,
                            },
                            {
                                name: "ADMIN",
                                permissions: adminPermissions,
                            },
                        ],
                    },
                },
            },
            select: { ...this.getChansSelect(username), id: true }
        })
        const adminRolePayload = await this.prisma.role.update({
            where: { chanId_name: { chanId: newChan.id, name: "ADMIN" } },
            data: {
                users: { connect: { name: username } },
                roles: {
                    connect: [
                        { chanId_name: { chanId: newChan.id, name: "DEFAULT" } },
                        { chanId_name: { chanId: newChan.id, name: "ADMIN" } },
                    ]
                },
            }, select: this.getChansSelect(username)['roles']['select']
        })
        const defaultRolePayload = await this.prisma.role.update({
            where: { chanId_name: { chanId: newChan.id, name: "DEFAULT" } },
            data: { users: { connect: { name: username } } },
            select: this.getChansSelect(username)['roles']['select']
        })
        const createdChan = this.formatChan(username, {
            ...newChan,
            roles: [adminRolePayload, defaultRolePayload]
        })
        this.sse.pushEvent(username, {
            type: 'CREATED_CHAN',
            data: createdChan
        }, sseId)
        return createdChan
	}

    public doesUserHasSelfPermInChan = (
        username: string,
        perm: z.infer<typeof zSelfPermissionList>,
        permPayload : SelfPermPayload
    ) =>
        this.getSelfPerm(username, permPayload).includes(perm)

    private isPermOver = (perm: PermissionList)
    : perm is Exclude<z.infer<typeof zPermissionOverList>, 'UNMUTE'> =>
        (zPermissionOverList.safeParse(perm).success)

    private getPermOverUserInChan(username: string,
        otherUserName: string,
        { roles, ownerName, timedStatusUsers }: PermPayload
    ): z.infer<typeof zPermissionOverList>[] {
        if (username === otherUserName)
            return ["DELETE_MESSAGE" as const]
        if (otherUserName === ownerName)
            return []
        const isOtherUserMuted = timedStatusUsers
            .some(el => el.timedUserName === otherUserName && el.type === 'MUTE')

        let perms: z.infer<typeof zPermissionOverList>[];

        if (username === ownerName)
            perms = zPermissionOverList.exclude(['UNMUTE']).options
        else {
            perms = [...new Set(roles
                .filter(role => role.users.some(user => user.name === username))
                .filter(role => role
                    .roles.some(el => el.users.some(user => user.name === otherUserName)))
                .filter(role => (role.users.every(user => user.name !== otherUserName)
                    || (role.roles.some(el => el.name === role.name))))
                .flatMap(role => role.permissions)
                .filter(this.isPermOver))]
        }
        if (perms.includes('MUTE') && isOtherUserMuted)
            perms.push('UNMUTE')
        return perms
    }

    public doesUserHasPermOverUserInChan = (
        username: string,
        otherUserName: string,
        permPayload: PermPayload,
        perm: z.infer<typeof zPermissionOverList>
    ) => this.getPermOverUserInChan(username, otherUserName, permPayload).includes(perm)

	async deleteChan(reqUser: EnrichedRequest['user'], chanId: string) {
        const { username } = reqUser
        const chan = await this.getChan({ id: chanId, users: { some: { name: username } } },
            {
                ...this.getSelfPermSelect(username),
                users: { select: { name: true } }
            })
        if (!chan)
            return contractErrors.NotFoundChan(chanId)
        if (!this.doesUserHasSelfPermInChan(username, 'DESTROY', chan))
            return contractErrors.ChanPermissionTooLow(username, chanId, 'DESTROY')
		await this.prisma.chan.delete({ where: { id: chanId } })
        this.chanInvitationsService.updateAndNotifyManyInvsStatus(
            ChanInvitationStatus.DELETED_CHAN,
            { chanId })
        this.sse.pushEventMultipleUser(this.usersToNames(chan.users),
            {
                type: 'DELETED_CHAN',
                data: { chanId }
            }, reqUser)
        return null
	}

	async leaveChan({ username, sseId }: EnrichedRequest['user'], chanId: string) {
		const chan = await this.getChan({ id: chanId, users: { some: { name: username } } },
			{
                ownerName: true,
                users: { select: { name: true } }
            })

        if (!chan)
            return contractErrors.NotFoundChan(chanId)
		if (username === chan.ownerName)
            return contractErrors.OwnerCannotLeaveChan()

		await this.prisma.chan.update({
			where: { id: chanId },
			data: { users: { disconnect: { name: username } } },
		})

        const chanUserNames = this.usersToNames(chan.users, username)

        new ChanElementFactory(chanId, username, this)
            .createClassicEvent('AUTHOR_LEAVED')
            .then(event => event.notifyByNames(chanUserNames))
        this.sse.pushEventMultipleUser(chanUserNames, {
            type: 'DELETED_CHAN_USER',
            data: { chanId, username }
        })
        this.sse.pushEvent(username, {
            type: 'DELETED_CHAN',
            data: { chanId }
        }, sseId)
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
        reqUser: EnrichedRequest['user'],
		chanId: string,
        { relatedTo, content }: RequestShapes["createChanMessage"]["body"],
	) {
        const { username } = reqUser
        const chan = await this.getChan({ id: chanId, users: { some: { name: username } } },
            {
                ...this.getSelfPermSelect(),
                users: { select: { name: true } },
                ...(relatedTo
                    ? { elements: { where: { id: relatedTo }, select: { id: true } } }
                    : {})
            })
        if (!chan)
            return contractErrors.NotFoundChan(chanId)
        if (!this.doesUserHasSelfPermInChan(username, 'SEND_MESSAGE', chan))
            return contractErrors.ChanPermissionTooLow(username, chanId, 'SEND_MESSAGE')
        if (relatedTo && !chan.elements?.length)
            return contractErrors.NotFoundChanEntity(chanId, "relatedTo element", relatedTo)
        const ats = this.getAtsFromChanMessageContent(chan, content)

        return (await new ChanElementFactory(chanId, username, this)
            .createMessage(content, relatedTo, ats))
            .notifyByUsers(chan.users, reqUser)
            .formatted()
	}

	async getChanElements(username: string, chanId: string,
        { nElements, cursor }: RequestShapes['getChanElements']['query']) {
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
        if (!chan.elements.length && cursor) {
            if (!(await this.getChan({id: chanId, elements: { some: { id: cursor } }},
                { id: true }))) {
                return contractErrors.NotFoundChanEntity(chanId, "element", cursor)
            }
        }
		return this.formatChanDiscussionElementArrayForUser(username, chan.elements.reverse())
	}

    async updateChanMessageIfRightTo(reqUser: EnrichedRequest['user'],
        { chanId, elementId }: RequestShapes['updateChanMessage']['params'],
        content: string
    ) {
        const { username } = reqUser
        const chan = await this.getChan({ id: chanId, users: { some: { name: username } } },
            {
                ...this.getSelfPermSelect(),
                users: { select: { name: true } },
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
        if (!chan.elements.length || !chan.elements[0]?.message)
            return contractErrors.NotFoundChanEntity(chanId, 'message', elementId)
        const oldMessage = chan.elements[0].message
        if (!this.doesUserHasSelfPermInChan(username, 'UPDATE_MESSAGE', chan))
            return contractErrors.ChanPermissionTooLow(username, chanId, 'UPDATE_MESSAGE')
        if (chan.elements[0].authorName !== username)
            return contractErrors.NotOwnedChanMessage(username, 'update', elementId, chanId)
        const newAts = this.getAtsFromChanMessageContent(chan, content)
        return (await new UpdateChanElementFactory(chanId, elementId, this)
            .updateMessage(content,
                { users: oldMessage.relatedUsers, roles: oldMessage.relatedRoles },
                newAts))
            .notifyByUsers(chan.users, reqUser)
            .formatted(username)
    }

	async deleteChanMessageIfRightTo(reqUser: EnrichedRequest['user'],
        { chanId , elementId }: RequestShapes['deleteChanMessage']['params']
    ) {
        const { username } = reqUser
        const chan = await this.getChan({ id: chanId, users: { some: { name: username } } },
            {
                ...this.getPermSelect(username),
                elements: {
                    where: { id: elementId, message: { isNot: null } },
                    select: { authorName: true }
                },
                users: { select: { name: true } }
            })
        if (!chan)
            return contractErrors.NotFoundChan(chanId)
        if (!chan.elements.length)
            return contractErrors.NotFoundChanEntity(chanId, 'message', elementId)
        const { authorName } = chan.elements[0]!
        if (!this.doesUserHasPermOverUserInChan(username, authorName, chan, 'DELETE_MESSAGE'))
            return contractErrors.ChanPermissionTooLowOverUser(username, authorName, chanId, 'DELETE_MESSAGE')
        return (await new UpdateChanElementFactory(chanId, elementId, this)
            .deleteMessage(username))
            .notifyByUsers(chan.users, reqUser)
            .formatted()
	}

    async banUserFromChanIfRighTo(reqUser: EnrichedRequest['user'],
        { username: otherUserName, chanId }: RequestShapes['banUserFromChan']['params'],
        timeoutInMs: number | 'infinity'
    ) {
        const { username } = reqUser
        const chan = await this.getChan({ id: chanId, users: { some: { name: username } } },
            {
                id: true,
                users: { where: { name: otherUserName }, select: { name: true } },
                ...this.getPermSelect(username, otherUserName)
            })
        if (!chan)
            return contractErrors.NotFoundChan(chanId)
        if (!chan.users.some(({ name }) => name === otherUserName))
            return contractErrors.NotFoundChanEntity(chanId, 'user', otherUserName)
        if (!this.doesUserHasPermOverUserInChan(username, otherUserName, chan, 'BAN'))
            return contractErrors.ChanPermissionTooLowOverUser(username, otherUserName, chanId, 'BAN')

        const untilDate = (timeoutInMs !== 'infinity') ? new Date((new Date()).getTime() + timeoutInMs) : null
        this.callbackService.deleteCallback(otherUserName, "UNBAN")

        if (chan.timedStatusUsers
                .some(({ timedUserName, type }) =>
                    (timedUserName === otherUserName && type === 'BAN'))
        ) {
            await this.prisma.timedStatusUserChan.updateMany({
                where: {
                    ...this.getTimedChanUsersByStatus('BAN'),
                    timedUserName: otherUserName
                },
                data: { untilDate }
            })
        } else {
            await this.prisma.timedStatusUserChan.create({
                data: {
                    type: 'BAN',
                    chanId,
                    timedUserName: otherUserName,
                    untilDate
                },
                select: this.timedStatusUserChanSelect
            })
        }
        const updatedChan = await this.prisma.chan.update({ where: { id: chanId },
            data: { users: { disconnect: { name: otherUserName } } },
            select: { users: { select: { name: true } } }
        })
        this.sse.pushEvent(otherUserName, { type: 'BANNED_FROM_CHAN', data: { chanId } })
        this.chanInvitationsService.updateAndNotifyManyInvsStatus('BANNED_FROM_CHAN',
            {
                chanId,
                OR: [{invitingUserName: otherUserName },
                    {invitedUserName: otherUserName}]
            })
        this.sse.pushEventMultipleUser(this.usersToNames(updatedChan.users), {
            type: 'BANNED_CHAN_USER',
            data: { chanId, username: otherUserName }
        }, reqUser)
        if (timeoutInMs === 'infinity')
            return
        const timeoutId = setTimeout(
            this.unbanUser.bind(this),
            timeoutInMs,
            otherUserName,
            chanId
        )
        this.callbackService.setCallback(otherUserName, "UNBAN", timeoutId)
    }

    async unbanUserIfRightTo(username: string, { chanId, username: otherUserName }: RequestShapes['unbanUserFromChan']['params']) {
        const chan = await this.getChan({ id: chanId, users: { some: { name: username } } },
            this.getPermSelect(username, otherUserName))
        if (!chan)
            return contractErrors.NotFoundChan(chanId)
        if (!this.doesUserHasPermOverUserInChan(username, otherUserName, chan, 'BAN'))
            return contractErrors.ChanPermissionTooLowOverUser(username, otherUserName, chanId, 'BAN')
        if (!chan.timedStatusUsers
                .some(({ timedUserName, type }) =>
                    (timedUserName === otherUserName && type === 'BAN'))
        ) {
            return contractErrors.NotFoundChanEntity(chanId, 'bannedUser', otherUserName)
        }
        await this.unbanUser(otherUserName, chanId)
    }

    async unbanUser(username: string, chanId: string) {
        const res = await this.endTimedStatusUserInChan(username, chanId,
            'BAN', { users: { select: { name: true } } })
        // this.sse.pushEventMultipleUser(this.usersToNames(res.users, username), {
        //     type: 'UNBANNED_CHAN_USER',
        //     data: { chanId, username }
        // })
    }

    async muteUserFromChanIfRightTo(username: string,
        { username: otherUserName, chanId }: RequestShapes['muteUserFromChan']['params'],
        timeoutInMs: number | 'infinity' 
    ) {
        const chan = await this.getChan({ id: chanId, users: { some: { name: username } } },
            {
                id: true,
                users: { select: { name: true, displayName: true } },
                ...this.getPermSelect(),
            })
        if (!chan)
            return contractErrors.NotFoundChan(chanId)
        const otherUser = chan.users.find(user => user.name === otherUserName)
        if (!otherUser)
            return contractErrors.NotFoundChanEntity(chanId, 'user', otherUserName)
        if (!this.doesUserHasPermOverUserInChan(username, otherUserName, chan, 'MUTE'))
            return contractErrors.ChanPermissionTooLowOverUser(username, otherUserName, chanId, 'MUTE')

        const untilDate = (timeoutInMs !== 'infinity') ? new Date((new Date()).getTime() + timeoutInMs) : null
        this.callbackService.deleteCallback(otherUserName, "UNMUTE")

        const timedStatusUser = { timedUserName: otherUserName, type: 'MUTE', untilDate } as const
        const timedStatusUsers = [{ ...timedStatusUser, timedUser: { displayName: otherUser.displayName } }]
        const updatedChan = { ...chan, timedStatusUsers }
        if (chan.timedStatusUsers
                .some(({ timedUserName, type }) => 
                    (timedUserName === otherUserName && type === 'MUTE'))
        ) {
            await this.prisma.timedStatusUserChan.updateMany({
                where: {
                    ...this.getTimedChanUsersByStatus('MUTE'),
                    chanId,
                    timedUserName: otherUserName
                },
                data: { untilDate },
            })
        } else {
            await this.prisma.timedStatusUserChan.create({
                data: {
                    ...timedStatusUser,
                    chanId,
                }
            })
            this.notifyUpdatedSelfPerm(otherUserName, { ...updatedChan, timedStatusUsers })
        }
        new ChanElementFactory(chanId, username, this)
            .createMutedUserEvent(otherUserName, timeoutInMs)
            .then(event => event.notifyByUsers(chan.users))
        chan.users.filter(({ name }) => name !== otherUserName).forEach(({ name }) => {
            const myPermissionOver = this.getPermOverUserInChan(name, otherUserName, updatedChan)
            this.sse.pushEvent(name, {
                type: 'UPDATED_CHAN_USER',
                data: { chanId, user: { name: otherUserName, myPermissionOver } }
            })
        })
        if (timeoutInMs === 'infinity')
            return
        const timeoutId = setTimeout(
            this.unmuteUser.bind(this),
            timeoutInMs,
            otherUserName,
            chanId
        )
        this.callbackService.setCallback(otherUserName, "UNMUTE", timeoutId)
    }

    async unmuteUser(username: string, chanId: string) {
        const res = await this.endTimedStatusUserInChan(username, chanId,
            'MUTE', { ...this.getPermSelect(), id: true, users: { select: { name: true } } })
        this.notifyUpdatedSelfPerm(username, res)
        this.usersToNames(res.users, username).forEach(name => {
            this.sse.pushEvent(name, {
                type: 'UPDATED_CHAN_USER',
                data: {
                    chanId,
                    user: {
                        name: username,
                        myPermissionOver: this.getPermOverUserInChan(name, username, res)
                    }
                }
            })
        })
    }

    async unmuteUserIfRightTo(username: string, { chanId, username: otherUserName }: RequestShapes['unmuteUserFromChan']['params']) {
        const chan = await this.getChan({ id: chanId, users: { some: { name: username } } },
            {
                // otherUserName needs to be here so it is included in
                // selected timedStatusUsers. So it can be found on the getPermOverUserInChan
                // and it can return the perm UNMUTE otherwise it will never return it
                ...this.getPermSelect(username, otherUserName),
                users: { where: { name: otherUserName }, select: { name: true } }
            })
        if (!chan)
            return contractErrors.NotFoundChan(chanId)
        if (!chan.users.some(user => user.name === otherUserName))
            return contractErrors.NotFoundChanEntity(chanId, 'user', otherUserName)
        if (!this.doesUserHasPermOverUserInChan(username, otherUserName, chan, 'UNMUTE'))
            return contractErrors.ChanPermissionTooLowOverUser(username, otherUserName, chanId, 'MUTE')
        await this.unmuteUser(otherUserName, chanId)
    }

    usersToNames = (users: { name: string }[], exclude?: string) => 
        users.map(user => user.name).filter(name => name !== exclude)

    async kickUserFromChanIfRightTo(reqUser: EnrichedRequest['user'],
        { username: otherUserName, chanId }: RequestShapes['kickUserFromChan']['params']
    ) {
        const { username } = reqUser
        const chan = await this.getChan({ id: chanId, users: { some: { name: username } } },
            {
                users: { select: { name: true } },
                ...this.getPermSelect(username)
            })

        if (!chan)
            return contractErrors.NotFoundChan(chanId)
        if (!chan.users.some(user => user.name === otherUserName))
            return contractErrors.NotFoundChanEntity(chanId, 'user', otherUserName)
        if (!this.doesUserHasPermOverUserInChan(username, otherUserName, chan, "KICK"))
            return contractErrors.ChanPermissionTooLowOverUser(username, otherUserName, chanId, 'KICK')

        await this.prisma.chan.update({
            where: { id: chanId },
            data: { users: { disconnect: { name: otherUserName } } }
        })

        const chanUserNames = this.usersToNames(chan.users, otherUserName)
        this.sse.pushEventMultipleUser(chanUserNames,
            {
                type: 'DELETED_CHAN_USER',
                data: {
                    chanId,
                    username: otherUserName
                }
            }, reqUser)
        this.sse.pushEvent(otherUserName, { type: 'KICKED_FROM_CHAN', data: { chanId } })
        new ChanElementFactory(chanId, username, this)
            .createClassicEvent('AUTHOR_KICKED_CONCERNED', otherUserName)
            .then(event => event.notifyByNames(chanUserNames))
    }

	public async pushUserToChanAndNotifyUsers(username: string, chanId: string) {
        const newChan = await this.prisma.$transaction(async (tx) => {
            const newChan = await tx.chan.update({
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

            if (newChan.timedStatusUsers.find(({ timedUserName, type }) => 
                timedUserName === username && type === 'BAN')
            )
                throw new Error('ban')

            return newChan
        }).catch((error: unknown) => {
            if (error instanceof Error && error.message === 'ban')
                return contractErrors.UserBannedFromChan(username, chanId, null)
            throw error
        })
        if (isContractError(newChan))
            return newChan
        const newUser = newChan.users.find(({ name }) => name === username)
        const users = newChan.users.filter(user => user.name !== username)
        users.forEach(user => this.sse.pushEvent(user.name,
            {
                type: "CREATED_CHAN_USER",
                data: {
                    chanId,
                    user: this.formatChanUserForUser(user.name, {
                        ...user,
                        name: username,
                        statusVisibilityLevel: newUser!.statusVisibilityLevel
                    }, newChan)
                }
            }))
        new ChanElementFactory(chanId, username, this)
            .createClassicEvent('AUTHOR_JOINED')
            .then(event => event.notifyByUsers(users))
		return this.formatChan(username, newChan)
	}

	public getChan = async <Sel extends Prisma.ChanSelect>(
		where: Prisma.ChanWhereUniqueInput,
		select: Prisma.Subset<Sel, Prisma.ChanSelect>,
	) => {
        type RetypeChan<T> = T extends Record<"elements", Record<ChanElementUnion, unknown>[]>
            ? Omit<T, "elements">
                & Record<"elements", RetypeChanElement<T['elements'][number]>[]>
            : T
        const chan = await this.prisma.chan.findUnique({ where, select })
        
        return chan as RetypeChan<typeof chan>
    }

	async joinChan({ username, sseId }: EnrichedRequest['user'], { title, password }: RequestShapes['joinChan']['body']) {
		const chan = await this.getChan(
			{
                
				title,
				type: ChanType.PUBLIC,
			},
			{
				password: true,
				users: { where: { name: username }, select: { name: true } },
                timedStatusUsers: {
                    where: { ...this.getTimedChanUsersByStatus('BAN'), timedUserName: username },
                    select: { type: true, timedUserName: true, untilDate: true }
                },
                id: true
			}
		)
        if (!chan)
            return contractErrors.NotFoundChan(title)
        const { password: chanPassword, users, timedStatusUsers } = chan
		if (users.some(({ name }) => name === username))
            return contractErrors.ChanUserAlreadyExist(username, title)
        const timedStatusUser = timedStatusUsers.find(({ timedUserName, type }) =>
                timedUserName === username && type === 'BAN')
        if (timedStatusUser)
            return contractErrors.UserBannedFromChan(username, title, timedStatusUser.untilDate)
		if (password && !chanPassword)
            return contractErrors.ChanDoesntNeedPassword(title)
		if (!password && chanPassword)
            return contractErrors.ChanNeedPassword(title)
		if (chanPassword && password && !compareSync(password, chanPassword))
            return contractErrors.ChanWrongPassword(title)
        await this.chanInvitationsService
            .updateAndNotifyManyInvsStatus('ACCEPTED', { chanId: chan.id, invitedUserName: username })
		const joinedChan = await this.pushUserToChanAndNotifyUsers(username, chan.id)
        if (isContractError(joinedChan))
            return joinedChan
        await this.sse.pushEvent(username, {
            type: 'CREATED_CHAN',
            data: joinedChan
        }, sseId)
        return joinedChan
	}

	async searchChans(username: string, { titleContains, nResult }: RequestShapes['searchChans']['query']) {
		const res = await this.prisma.chan.findMany({
			where: {
				type: ChanType.PUBLIC,
				title: { contains: titleContains, not: null },
                timedStatusUsers: { none: { type: 'BAN', timedUserName: username } },
                users: { none: { name: username } }
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
                title: title as Exclude<typeof title, null>,
                ...trimmedEl
            }
		})
	}

    // BH //
    async setUserAdminStateIfRightTo(
        username: string,
        state: boolean,
        { chanId, username: otherUserName }: RequestShapes['setUserAdminState']['params']
    ) {
        const chan = await this.getChan({ id: chanId, users: { some: { name: username } } },
            {
                users: { select: { name: true } },
                ...this.getSelfPermSelect()
            })
        if (!chan)
            return contractErrors.NotFoundChan(chanId)
        if (chan.ownerName !== username)
            return contractErrors.ChanPermissionTooLow(username, chanId, 'ROLES_ATTRIBUTION')
        if (!chan.users.some(user => user.name === otherUserName))
            return contractErrors.NotFoundChanEntity(chanId, 'user', otherUserName)
        const adminRole = chan.roles.find(role => role.name === 'ADMIN')
        if (!adminRole)
            return contractErrors.NotFoundChanEntity(chanId, 'role', 'ADMIN')

        const isOtherUserAdmin = !!adminRole.users.some(user => user.name === otherUserName)
        if ((isOtherUserAdmin && state) || (!isOtherUserAdmin && !state))
            return ;

        // prisma sucks lol (at least as much as myself)
        await this.prisma.role.update({ where: { chanId_name: { chanId, name: 'ADMIN' } },
            data: {
                users: (state
                    ? { connect: { name: otherUserName } }
                    : { disconnect: { name: otherUserName } })
            }})
        const updatedChan = await this.getChan({ id: chanId },
            {
                id: true,
                ...this.getPermSelect(),
            })
        if (!updatedChan)
            return
        this.notifyUpdatedSelfPerm(otherUserName, updatedChan)
        this.notifyUpdatedChanUser(otherUserName,
            this.usersToNames(chan.users),
            updatedChan)
    }
    // BH //
    
    private notifyUpdatedChanUser = (
        username: string, usernames: string[],
        payload: PermPayload & { id: string }
    ) => (usernames.forEach(name => {
        const usersNewPermOverUser = this.getPermOverUserInChan(name, username, payload)
        const userNewRolesSet = payload.roles
            .filter(role => role.users.some(user => user.name === username))
            .map(role => role.name)
        this.sse.pushEvent(name, {
            type: 'UPDATED_CHAN_USER',
            data: {
                chanId: payload.id,
                user: {
                    name: username,
                    roles: userNewRolesSet,
                    myPermissionOver: usersNewPermOverUser
                }
            }
        })
        const userNewPermOverUsers = this.getPermOverUserInChan(username, name, payload)
        this.sse.pushEvent(username, {
            type: 'UPDATED_CHAN_USER',
            data: {
                chanId: payload.id,
                user: {
                    name,
                    myPermissionOver: userNewPermOverUsers
                }
            }
        })
    }))
    
    async updateChan(reqUser: EnrichedRequest['user'], chanId: string, body: RequestShapes['updateChan']['body']) {
        const { username } = reqUser
        const chan = await this.getChan({ id: chanId, users: { some: { name: username } } },
            {
                ...this.getSelfPermSelect(username),
                password: true,
                users: { select: { name: true } },
                title: true
            })
        if (!chan)
            return contractErrors.NotFoundChan(chanId)
        if (!this.doesUserHasSelfPermInChan(username, 'EDIT', chan))
            return contractErrors.ChanPermissionTooLow(username, chanId, 'EDIT')
        if (body.type === 'PUBLIC' && body.password)
            body.password = await hash(body.password, 10)
        if (body.title && await this.getChan({ title: body.title }, { id: true }))
            return contractErrors.ChanAlreadyExist(body.title)
        await this.prisma.chan.update({ where: { id: chanId }, data: body })
        const toNotify = this.usersToNames(chan.users)
        const { password, ...bodyRest } = (body.type === 'PUBLIC')
            ? body
            : { ...body, password: chan.password }
        if (body.title !== undefined && body.title !== chan.title) {
            new ChanElementFactory(chanId, username, this)
                .createChangedTitleEvent(chan.title, body.title)
                .then(event => event.notifyByNames(toNotify))
        }
        this.sse.pushEventMultipleUser(toNotify, {
            type: 'UPDATED_CHAN_INFO',
            data: {
                id: chanId,
                ...bodyRest,
                passwordProtected: !!password,
                title: (body.title) ? body.title : null
            }
        }, reqUser)
    }

}
