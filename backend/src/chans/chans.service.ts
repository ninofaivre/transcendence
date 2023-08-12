import { Inject, Injectable, forwardRef } from "@nestjs/common"
import {
	ChanType,
	PermissionList,
	Prisma,
	ChanInvitationStatus,
	ClassicChanEventType,
} from "@prisma/client"
import { compareSync, hash } from "bcrypt"
import { SseService } from "src/sse/sse.service"
import { NestRequestShapes } from "@ts-rest/nest"
import { GetData, SseEvent, contract, contractErrors, isContractError } from "contract"
import { ChanEvent, zChanDiscussionElementReturn, zChanDiscussionEventReturn } from "contract"
import { z } from "zod"
import { ChanInvitationsService } from "src/invitations/chan-invitations/chan-invitations.service"
import { PrismaService } from "src/prisma/prisma.service"
import { UserService } from "src/user/user.service"
import { zSelfPermissionList } from "contract"
import { zChanDiscussionMessageReturn } from "contract"
import { ChanElementUnion, RetypeChanElement } from "src/types"
import { zPermissionOverList } from "contract"
import { CallbackService } from "src/callback/callback.service"
import { ChanElementFactory } from "./element"

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
type DoesUserHasSelfPermPayload = Prisma.ChanGetPayload<
    { select: ReturnType<ChansService['getDoesUserHasSelfPermSelect']> }>
type DoesUserHasPermOverUserPayload = Prisma.ChanGetPayload<
    { select: ReturnType<ChansService['getDoesUserHasPermOverUserSelect']> }>

@Injectable()
export class ChansService {

    private getMutedUsersWhere = (currentDate: Date) => ({
        OR: [
            { untilDate: { gte: currentDate } },
            { untilDate: null }
        ]
    } satisfies Prisma.Chan$mutedUsersArgs['where'])

    private async unmuteUserInChan(username: string, chanId: string) {
        await this.prisma.chan.update({ where: { id: chanId },
            data: {
                mutedUsers: {
                    updateMany: {
                        where: {
                            mutedUserName: username,
                            ...this.getMutedUsersWhere(new Date())
                        },
                        data: { untilDate: new Date() }
                    }
                }
            }})
        const chan = await this.getChan({ id: chanId, users: { some: { name: username } } },
            { ...this.getDoesUserHasSelfPermSelect(username) })
        if (!chan)
            return
        const selfPerms = this.getSelfPerm(username, chan)
        await this.sse.pushEvent(username, {
            type: 'UPDATED_CHAN_SELF_PERMS',
            data: { chanId, selfPerms }
        })
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
            where: { mutedUsers: { some: this.getMutedUsersWhere(new Date()) } },
            select: {
                id: true,
                mutedUsers: {
                    where: this.getMutedUsersWhere(new Date()),
                    select: {
                        untilDate: true,
                        mutedUserName: true
                    }
                }
            }})
            .then(chans => {
                const currentDateMs = (new Date()).getTime()
                chans.forEach(({ id: chanId, mutedUsers }) => {
                    mutedUsers.forEach(({ mutedUserName, untilDate }) => {
                        if (!untilDate)
                            return
                        const timeoutId = setTimeout(
                            this.unmuteUserInChan.bind(this),
                            untilDate.getTime() - currentDateMs,
                            mutedUserName,
                            chanId)
                        this.callbackService.setCallback(mutedUserName,
                            "unMute",
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
            }
        },
        mutedUsers: {
            where: {
                mutedUserName: username,
                ...this.getMutedUsersWhere(new Date())
            },
            select: { untilDate: true, mutedUserName: true }
        },
		...this.getDoesUserHasPermOverUserSelect(username, {}),
        password: true
	} satisfies Prisma.ChanSelect)

    // TODO for both functions under this comment add select and remove username + perm

    // TODO change in something like get user self perm idk kqjsdkfljklqjsdfkljqk
    public getDoesUserHasSelfPermSelect = (username: string) => ({
        roles: {
            select: {
                users: {
                    where: { name: username },
                    select: { name: true }
                },
                permissions: true,
            }
        },
        ownerName: true,
        mutedUsers: {
            where: {
                mutedUserName: username,
                ...this.getMutedUsersWhere(new Date())
            },
            select: { untilDate: true, mutedUserName: true }
        }
    } satisfies Prisma.ChanSelect)

    public getDoesUserHasPermOverUserSelect = (
        username: string,
        where: Prisma.RoleWhereInput = { users: { some: { name: username } } }
    ) => ({
        roles: {
            where,
            select: {
                users: { select: { name: true } },
                roles: { select: { users: { select: { name: true } }, name: true } },
                permissions: true,
                name: true
            },
        },
        ownerName: true,
    } satisfies Prisma.ChanSelect)

	private chanDiscussionEventsSelect = {
		concernedUserName: true,
		classicChanDiscussionEvent: { select: { eventType: true } },
        mutedUserChanDiscussionEvent: { select: { mutedUserName: true, timeoutInMs: true } },
		changedTitleChanDiscussionEvent: { select: { oldTitle: true, newTitle: true } },
		deletedMessageChanDiscussionEvent: { select: { deletingUserName: true } },
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

	private defaultPermissions: PermissionList[] = [
		"INVITE",
		"SEND_MESSAGE",
        "UPDATE_MESSAGE",
	]

	private adminPermissions: PermissionList[] = [
		"KICK",
		"BAN",
		"MUTE",
		"DELETE_MESSAGE",
	]

	private namesArrayToStringArray(users: { name: string }[]) {
		return users.map((el) => el.name)
	}

    private formatChanUserForUser = (
        username: string,
        user: ChanPayload['users'][number],
        permPayload: Pick<ChanPayload, "roles" | "ownerName">
    ) => ({
            name: user.name,
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

    private getSelfPerm(
        username: string,
        { ownerName, roles, mutedUsers }: DoesUserHasSelfPermPayload
    ) {
        if (username === ownerName)
            return zSelfPermissionList.options
        const perms = [...new Set(roles
            .filter(role => role.users.some(user => user.name === username))
            .flatMap(role => role.permissions)
            .filter(this.isSelfPerm))]
        if (mutedUsers.some(user => user.mutedUserName === username)) {
            return perms 
                .filter(perm => (perm !== 'SEND_MESSAGE' && perm !== 'UPDATE_MESSAGE'))
        }
        return perms
    }

	private formatChan(username: string, chan: ChanPayload) {
		const { password, roles, users, mutedUsers, ...rest } = chan
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
            relatedTo: related && this.formatChanDiscussionElementForUser(username, (related.message) ? { ...related, message: { ...related['message'], related: null } } : related),
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
        element: ChanDiscussionElementEventWithoutDeletedPayload
    ) {
        const { event, authorName: author, ...elementRest } = element
        const {
            deletedMessageChanDiscussionEvent,
            changedTitleChanDiscussionEvent,
            mutedUserChanDiscussionEvent,
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
        else if (mutedUserChanDiscussionEvent) {
            const { mutedUserName, timeoutInMs } = mutedUserChanDiscussionEvent
            return {
                ...elementRest,
                ...eventRest,
                author,
                concernedUserName: mutedUserName,
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
            concernMe: concernedUserName === username,
            author,
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
				orderBy: { type: "desc" },
			}),
		)
	}

	async createChan(username: string, chan: RequestShapes["createChan"]["body"]) {
		if (chan.type === "PUBLIC" && chan.password)
            chan.password = await hash(chan.password, 10)
        if (chan.title && await this.getChan({ title: chan.title }, { id: true }))
            return contractErrors.ChanAlreadyExist(chan.title)
        const { id: chanId } = await this.prisma.chan.create({
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
                            },
                            {
                                name: "ADMIN",
                                permissions: this.adminPermissions,
                            },
                        ],
                    },
                },
            },
            select: { id: true },
        })
        await Promise.all([this.prisma.role.update({
            where: { chanId_name: { chanId, name: "ADMIN" } },
            data: {
                users: { connect: { name: username } },
                roles: {
                    connect: [
                        { chanId_name: { chanId, name: "DEFAULT" } },
                        { chanId_name: { chanId, name: "ADMIN" } },
                    ]
                },
            },
        }),
        this.prisma.role.update({
            where: { chanId_name: { chanId, name: "DEFAULT" } },
            data: { users: { connect: { name: username } } }
        })])
        const res = await this.getChan({ id: chanId }, this.getChansSelect(username))
        if (!res)
            return contractErrors.EntityModifiedBetweenCreationAndRead("Chan")
        return this.formatChan(username, res)
	}

    public doesUserHasSelfPermInChan = (
        username: string,
        perm: z.infer<typeof zSelfPermissionList>,
        permPayload : DoesUserHasSelfPermPayload
    ) =>
        this.getSelfPerm(username, permPayload).includes(perm)

    private isPermOver = (perm: PermissionList)
    : perm is z.infer<typeof zPermissionOverList> =>
        zPermissionOverList.safeParse(perm).success

    private getPermOverUserInChan(username: string,
        otherUserName: string,
        { roles, ownerName }: DoesUserHasPermOverUserPayload
    ) {
        if (username === otherUserName)
            return ["DELETE_MESSAGE" as const]
        if (otherUserName === ownerName)
            return []
        if (username === ownerName)
            return zPermissionOverList.options
        return [...new Set(roles
            .filter(role => role.users.some(user => user.name === username))
            .filter(role => role
                .roles.some(el => el.users.some(user => user.name === otherUserName)))
            .filter(role => (role.users.every(user => user.name !== otherUserName)
                || (role.roles.some(el => el.name === role.name))))
            .flatMap(role => role.permissions)
            .filter(this.isPermOver))]
    }

    public doesUserHasPermOverUserInChan = (
        username: string,
        otherUserName: string,
        permPayload: DoesUserHasPermOverUserPayload,
        perm: Exclude<PermissionList, z.infer<typeof zSelfPermissionList>>
    ) => this.getPermOverUserInChan(username, otherUserName, permPayload).includes(perm)

	async deleteChan(username: string, chanId: string) {
        
        const chan = await this.getChan({ id: chanId, users: { some: { name: username } } },
            {
                ...this.getDoesUserHasSelfPermSelect(username),
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
        this.sse.pushEventMultipleUser(chan.users.map(el => el.name),
            {
                type: 'DELETED_CHAN',
                data: { chanId }
            })
        return null
	}

	async leaveChan(username: string, chanId: string) {
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
            .createClassicEvent(['AUTHOR_LEAVED'])
            .then(event => event.notifyByNames(chanUserNames))
        this.sse.pushEventMultipleUser(chanUserNames, {
            type: 'DELETED_CHAN_USER',
            data: { chanId, username }
        })
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
                ...this.getDoesUserHasSelfPermSelect(username),
                users: { select: { name: true } },
                roles: {
                    select: {
                        ...(this.getDoesUserHasSelfPermSelect(username)
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
        if (!this.doesUserHasSelfPermInChan(username, 'SEND_MESSAGE', chan))
            return contractErrors.ChanPermissionTooLow(username, chanId, 'SEND_MESSAGE')
        if (relatedTo && !chan.elements?.length)
            return contractErrors.NotFoundChanEntity(chanId, "relatedTo element", relatedTo)
        const ats = this.getAtsFromChanMessageContent(chan, content)

        const newMessage = await (new ChanElementFactory(chanId, username, this)
            .createMessage(content, relatedTo, ats))
        newMessage.notifyByUsers(chan.users.filter(user => user.name !== username))
        return newMessage.formatted()
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

    async updateChanMessage(
        chanId: string,
        elementId: string,
        oldAts: { roles: { name: string }[], users: { name: string }[] },
        newAts: { roles: { name: string }[], users: { name: string }[] },
        content: string
    ) {
        const updatedElement = await this.prisma.chanDiscussionElement.update({
            where: { id: elementId, message: { isNot: null } },
            data: {
                message: {
                    update: {
                        content: content,
                        relatedUsers: {
                            connect: newAts.users
                                .filter(el => oldAts.users.every(user => user.name !== el.name)),
                            disconnect: oldAts.users
                                .filter(user => newAts.users.every(el => el.name !== user.name))
                        },
                        relatedRoles: {
                            connect: newAts.roles
                                .filter(el => oldAts.roles.every(role => role.name !== el.name))
                                .map(el => ({ chanId_name: { chanId, ...el } })),
                            disconnect: oldAts.roles
                                .filter(role => newAts.roles.every(el => el.name !== role.name))
                                .map(el => ({ chanId_name: { chanId, ...el } }))
                        }
                    }
                }
            },
            select: this.chanDiscussionElementsSelect
        })
        const retypedUpdatedElement = updatedElement as RetypeChanElement<typeof updatedElement>
        const { message } = retypedUpdatedElement 
        if (!message)
            return contractErrors.EntityModifiedBetweenUpdateAndRead('ChanMessage')
        return { ...retypedUpdatedElement, message } as const
    }

    async updateChanMessageIfRightTo(username: string,
        { chanId, elementId }: RequestShapes['updateChanMessage']['params'],
        content: string
    ) {
        const chan = await this.getChan({ id: chanId, users: { some: { name: username } } },
            {
                ...this.getDoesUserHasSelfPermSelect(username),
                users: { select: { name: true } },
                roles: {
                    select: {
                        ...(this.getDoesUserHasSelfPermSelect(username)
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
            return contractErrors.NotFoundChanEntity(chanId, 'message', elementId)
        const oldMessage = chan.elements[0].message
        if (!this.doesUserHasSelfPermInChan(username, 'UPDATE_MESSAGE', chan))
            return contractErrors.ChanPermissionTooLow(username, chanId, 'UPDATE_MESSAGE')
        if (chan.elements[0].authorName !== username)
            return contractErrors.NotOwnedChanMessage(username, 'update', elementId, chanId)
        const newAts = this.getAtsFromChanMessageContent(chan, content)
        const updatedElement = await this.updateChanMessage(chanId, elementId,
            { users: oldMessage.relatedUsers, roles: oldMessage.relatedRoles },
            newAts, content)
        if (isContractError(updatedElement))
            return updatedElement
        chan.users.forEach(({ name }) => {
            this.sse.pushEvent(name, {
                type: 'UPDATED_CHAN_MESSAGE',
                data: {
                    chanId,
                    message: this.formatChanDiscussionMessageForUser(name, updatedElement)
                }
            })
        })
        return this.formatChanDiscussionMessageForUser(username, updatedElement)
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
        const retypedDeletedElement = deletedElement as RetypeChanElement<typeof deletedElement>
        const { event } = retypedDeletedElement
        if (!event?.deletedMessageChanDiscussionEvent)
            return contractErrors.EntityModifiedBetweenUpdateAndRead('ChanMessage')
        return { ...retypedDeletedElement, event } as const
    }

	async deleteChanMessageIfRightTo(username: string, { chanId , elementId }: RequestShapes['deleteChanMessage']['params']) {
        const chan = await this.getChan({ id: chanId, users: { some: { name: username } } },
            {
                ...this.getDoesUserHasPermOverUserSelect(username),
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

    async muteUserFromChanIfRightTo(username: string,
        { username: otherUserName, chanId }: RequestShapes['muteUserFromChan']['params'],
        timeoutInMs: number | 'infinity' 
    ) {
        const chan = await this.getChan({ id: chanId, users: { some: { name: username } } },
            {
                mutedUsers: {
                    where: {
                        mutedUserName: otherUserName,
                        ...this.getMutedUsersWhere(new Date())
                    },
                    select: { id: true }
                },
                users: { select: { name: true } },
                ...this.getDoesUserHasPermOverUserSelect(username,
                    { users: { some: { OR: [{ name: username }, { name: otherUserName }] } } })
            })
        if (!chan)
            return contractErrors.NotFoundChan(chanId)
        if (!chan.users.some(user => user.name === otherUserName))
            return contractErrors.NotFoundChanEntity(chanId, 'user', otherUserName)
        if (!this.doesUserHasPermOverUserInChan(username, otherUserName, chan, 'MUTE'))
            return contractErrors.ChanPermissionTooLowOverUser(username, otherUserName, chanId, 'MUTE')

        const untilDate = (timeoutInMs !== 'infinity') ? new Date((new Date()).getTime() + timeoutInMs) : null

        this.callbackService.deleteCallback(otherUserName, "unMute")
        await this.prisma.chan.update({ where: { id: chanId },
            data: {
                mutedUsers: (chan.mutedUsers.length
                    ? {
                        update: {
                            where: { id: chan.mutedUsers[0].id },
                            data: { untilDate }
                        }
                    }
                    : {
                        create: {
                            mutedUserName: otherUserName,
                            untilDate
                        }
                    })
            }})

        new ChanElementFactory(chanId, username, this)
            .createMutedUserEvent(otherUserName, timeoutInMs)
            .then(event => event.notifyByUsers(chan.users))

        this.sse.pushEvent(otherUserName, {
            type: 'UPDATED_CHAN_SELF_PERMS',
            data: {
                chanId,
                selfPerms: this.getSelfPerm(otherUserName,
                    {
                        ...chan,
                        mutedUsers: [{ untilDate, mutedUserName: otherUserName }]
                    })
            }
        })
        if (timeoutInMs === 'infinity')
            return
        const timeoutId = setTimeout(
            this.unmuteUserInChan.bind(this),
            timeoutInMs,
            otherUserName,
            chanId
        )
        this.callbackService.setCallback(otherUserName,
            "unMute",
            timeoutId)
    }

    usersToNames = (users: { name: string }[], exclude?: string) => 
        users.map(user => user.name).filter(name => name !== exclude)

    async kickUserFromChanIfRightTo(username: string,
        { username: otherUserName, chanId }: RequestShapes['kickUserFromChan']['params']
    ) {
        const chan = await this.getChan({ id: chanId, users: { some: { name: username } } },
            {
                users: { select: { name: true } },
                ...this.getDoesUserHasPermOverUserSelect(username)
            })

        if (!chan)
            return contractErrors.NotFoundChan(chanId)
        if (!chan.users.some(user => user.name === otherUserName))
            return contractErrors.NotFoundChanEntity(chanId, 'user', otherUserName)
        if (!this.doesUserHasPermOverUserInChan(username, otherUserName, chan, "KICK"))
            return contractErrors.ChanPermissionTooLowOverUser(username, otherUserName, chanId, 'KICK')

        const res = await this.prisma.chan.update({
            where: { id: chanId },
            data: { users: { disconnect: { name: otherUserName } } }
        })

        const chanUserNames = this.usersToNames(chan.users, otherUserName)
        this.sse.pushEventMultipleUser(chanUserNames.filter(name => name !== username),
            {
                type: 'DELETED_CHAN_USER',
                data: {
                    chanId,
                    username: otherUserName
                }
            })
        this.sse.pushEvent(otherUserName,
            {
                type: 'DELETED_CHAN',
                data: { chanId }
            })
        new ChanElementFactory(chanId, username, this)
            .createClassicEvent(['AUTHOR_KICKED_CONCERNED', otherUserName])
            .then(event => event.notifyByNames(chanUserNames))
    }

    notifyChanElement = async (users: string[],
        unformattedElement: ChanDiscussionElementPayload,
        chanId: string
    ) => Promise.all(users.map(name => this.sse.pushEvent(name, {
            type: 'CREATED_CHAN_ELEMENT',
            data: {
                chanId,
                element: this.
                    formatChanDiscussionElementForUser(name, unformattedElement)
            }
        })))

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
            return contractErrors.EntityModifiedBetweenCreationAndRead('ChanUser')

        const users = newChan.users.filter(user => user.name !== username)
        users.forEach(user => this.sse.pushEvent(user.name,
            {
                type: "CREATED_CHAN_USER",
                data: {
                    chanId,
                    user: this.formatChanUserForUser(user.name, {
                        ...user,
                        name: username,
                        statusVisibilityLevel: newUser.statusVisibilityLevel
                    }, newChan)
                }
            }))
        new ChanElementFactory(chanId, username, this)
            .createClassicEvent(['AUTHOR_JOINED'])
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

    // BH //
    async setUserAdminStateIfRightTo(
        username: string,
        state: boolean,
        { chanId, username: otherUserName }: RequestShapes['setUserAdminState']['params']
    ) {
        const chan = await this.getChan({ id: chanId, users: { some: { name: username } } },
            {
                users: { select: { name: true } },
                ...this.getDoesUserHasPermOverUserSelect(otherUserName, {})
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
                ...this.getDoesUserHasPermOverUserSelect(otherUserName, {}),
                mutedUsers: {
                    where: {
                        mutedUserName: otherUserName,
                        ...this.getMutedUsersWhere(new Date())
                    }
                }
            })
        if (!updatedChan)
            return
        this.sse.pushEvent(otherUserName, {
            type: 'UPDATED_CHAN_SELF_PERMS',
            data: { chanId, selfPerms: this.getSelfPerm(otherUserName, updatedChan) }
        })
        chan.users.filter(user => user.name !== username).forEach(({ name }) => {
            const newPermOverOther = this.getPermOverUserInChan(name, otherUserName, updatedChan)
            const otherNewPermOver = this.getPermOverUserInChan(otherUserName, name, updatedChan)
            this.sse.pushEvent(name, {
                type: 'UPDATED_CHAN_USER',
                data: {
                    chanId,
                    user: {
                        name: otherUserName,
                        roles: updatedChan.roles
                            .filter(role => role.users
                                .some(user => user.name === otherUserName))
                            .map(role => role.name),
                        myPermissionOver: newPermOverOther
                    }
                }
            })
            if (name === otherUserName)
                return
            this.sse.pushEvent(otherUserName, {
                type: 'UPDATED_CHAN_USER',
                data: {
                    chanId,
                    user: {
                        name,
                        myPermissionOver: otherNewPermOver
                    }
                }
            })
        })
    }
    // BH //
    
    async updateChan(username: string, chanId: string, body: RequestShapes['updateChan']['body']) {
        const chan = await this.getChan({ id: chanId, users: { some: { name: username } } },
            {
                ...this.getDoesUserHasSelfPermSelect(username),
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
        if (body.title && await this.getChan({ title: body.title }, {}))
            return contractErrors.ChanAlreadyExist(body.title)
        await this.prisma.chan.update({ where: { id: chanId }, data: body })
        const toNotify = chan.users.map(({ name }) => name).filter(name => name !== username)
        const { password, ...bodyRest } = (body.type === 'PUBLIC')
            ? body
            : { ...body, password: chan.password }
        if (body.title !== chan.title) {
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
        })
    }

}
