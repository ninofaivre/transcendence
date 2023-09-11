import { PrismaService } from "src/prisma/prisma.service"
import { ChanDiscussionElementEventWithoutDeletedPayload,
    ChanDiscussionElementMessageWithDeletedPayload,
    ChanDiscussionElementPayload, ChansService } from "./chans.service"
import { ClassicChanEventType, Prisma } from "@prisma/client"
import { Inject, forwardRef } from "@nestjs/common"
import { SseEvent } from "contract"
import { EnrichedRequest } from "src/types"

type ChanMessageType = 'CREATED' | 'UPDATED'

abstract class ChanElement {

    protected readonly abstract chansService: ChansService
    protected readonly abstract chanId: string
    protected readonly abstract element: ChanDiscussionElementPayload

    public notifyByUsers = (users: { name: string }[], ignoreSse?: EnrichedRequest['user']) =>
        this.notifyByNames(users.map(user => user.name), ignoreSse)

    public notifyByNames(users: string[], ignoreSse?: EnrichedRequest['user']) {
        users.forEach(name =>
            this.chansService.sse
                .pushEvent(name,
                    this.getSseEvent(name),
                    (ignoreSse && ignoreSse.username === name)
                        ? ignoreSse.sseId
                        : undefined
                )
        )
        return this
    }

    protected getSseEvent(name: string): SseEvent {
        return ({
            type: `CREATED_CHAN_ELEMENT`,
            data: {
                chanId: this.chanId,
                element: this.chansService.
                    formatChanDiscussionElementForUser(name, this.element)
            }
        } as const)
    }

}

class ChanElementEvent extends ChanElement {

    protected readonly element: ChanDiscussionElementEventWithoutDeletedPayload

    constructor(
        element: ChanDiscussionElementPayload,
        protected readonly chanId: string,
        @Inject(forwardRef(() => ChansService))
        protected readonly chansService: ChansService

    ) {
        super()
        this.element = element as ChanDiscussionElementEventWithoutDeletedPayload
    }

}

class ChanElementMessage extends ChanElement {

    protected readonly element: ChanDiscussionElementMessageWithDeletedPayload

    constructor(
        element: ChanDiscussionElementPayload,
        protected readonly chanId: string,
        @Inject(forwardRef(() => ChansService))
        protected readonly chansService: ChansService,
        private chanMessageType: ChanMessageType
    ) {
        super()
        this.element = element as ChanDiscussionElementMessageWithDeletedPayload
    }

    formatted = (username?: string) =>
    (this.chansService.formatChanDiscussionMessageForUser(
        username || this.element.authorName,
        this.element
    ))

    protected getSseEvent(name: string): SseEvent {
        return (this.chanMessageType === "CREATED"
            ? super.getSseEvent(name)
            : {
                type:`UPDATED_CHAN_MESSAGE`,
                data: {
                    chanId: this.chanId,
                    message: this.formatted(name)
                }
            } as const)
    }

}

export class ChanElementFactory {

    private readonly prisma: PrismaService

    constructor(
        private chanId: string,
        private author: string,
        @Inject(forwardRef(() => ChansService))
        private readonly chansService: ChansService
    ) {
        this.prisma = this.chansService.prisma
    }

    private createNewChanElement = async (
        arg: Omit<Prisma.ChanDiscussionElementCreateArgs['data'], "author" | "chan" | "messageId" | "eventId" | "authorName" | "chanId">
    ) => (this.prisma.chanDiscussionElement.create({
        data: {
            author: { connect: { name: this.author } },
            chan: { connect: { id: this.chanId } },
            ...arg
        },
        select: this.chansService.chanDiscussionElementsSelect
    }) as Promise<ChanDiscussionElementPayload>)


    public async createClassicEvent(
        ...[ eventType, concerned ]:
            | [ eventType: ClassicChanEventType & `${string}_CONCERNED`, concerned: string ]
            | [ eventType: Exclude<ClassicChanEventType, `${string}_CONCERNED`> ]
    ) {
        return new ChanElementEvent(await (this.createNewChanElement({
            event: {
                create: {
                    classicChanDiscussionEvent: { create: { eventType } },
                    ...(concerned
                        ? { concernedUser: { connect: { name: concerned } } }
                        : {})
                }
            }
        })), this.chanId, this.chansService)
    }

    public createMutedUserEvent = async (concerned: string, timeoutInMs: number | 'infinity') =>
    (new ChanElementEvent(await (this.createNewChanElement({
        event: {
            create: {
                mutedUserChanDiscussionEvent: {
                    create: {
                        mutedUser: { connect: { name: concerned } },
                        ...(timeoutInMs !== 'infinity'
                            ? { timeoutInMs : timeoutInMs }
                            : {})
                    }
                }
            }
        }
    })), this.chanId, this.chansService))

    public createChangedTitleEvent = async (oldTitle: string | null, newTitle: string | null) =>
    (new ChanElementEvent(await (this.createNewChanElement({
        event: {
            create: {
                changedTitleChanDiscussionEvent: {
                    create: {
                        oldTitle: oldTitle || 'no title',
                        newTitle: newTitle || 'no title'
                    }
                }
            }
        }
    })), this.chanId, this.chansService))

    public async createMessage(
		content: string,
		relatedTo: string | undefined,
        ats: { users: { name: string }[], roles: { name: string }[] }
    ) {
        return new ChanElementMessage(await (this.createNewChanElement({
            message: {
                create: {
                    content,
                    related: relatedTo ? { connect: { id: relatedTo } } : undefined,
                    relatedUsers: { connect: ats.users },
                    relatedRoles: {
                        connect: ats.roles
                            .map(role => ({ chanId_name: { chanId: this.chanId, ...role } }))
                    }
                }
            }
        })), this.chanId, this.chansService, 'CREATED')
    }

}

export class UpdateChanElementFactory {
    
    private readonly prisma: PrismaService;

    constructor(
        private chanId: string,
        private elementId: string,
        @Inject(forwardRef(() => ChansService))
        private readonly chansService: ChansService
    ) {
        this.prisma = this.chansService.prisma
    }

    private updateChanElement = async (
        data: Prisma.ChanDiscussionElementUpdateArgs['data']
    ) => (this.prisma.chanDiscussionElement.update({
            where: { id: this.elementId },
            data,
            select: this.chansService.chanDiscussionElementsSelect
        }) as Promise<ChanDiscussionElementPayload>)

    public updateMessage = async (
        content: string,
        oldAts: { users: { name: string }[], roles: { name: string }[] },
        newAts: { users: { name: string }[], roles: { name: string }[] }
    ) => {
        return new ChanElementMessage((await this.updateChanElement({
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
                            .map(el => ({ chanId_name: { chanId: this.chanId, ...el } })),
                        disconnect: oldAts.roles
                            .filter(role => newAts.roles.every(el => el.name !== role.name))
                            .map(el => ({ chanId_name: { chanId: this.chanId, ...el } }))
                    }
                }
            }
        })), this.chanId, this.chansService, 'UPDATED')
    }

    public deleteMessage = async (deletingUserName: string) => {
        return new ChanElementMessage((await this.updateChanElement({
            event: {
                create: {
                    deletedMessageChanDiscussionEvent: {
                        create: { deletingUserName },
                    },
                },
            },
            message: { delete: {} }
        })), this.chanId, this.chansService, 'UPDATED')
    }

}
