import { PrismaService } from "src/prisma/prisma.service"
import { ChanDiscussionElementEventWithoutDeletedPayload,
    ChanDiscussionElementMessageWithDeletedPayload,
    ChanDiscussionElementPayload, ChansService } from "./chans.service"
import { ClassicChanEventType, Prisma } from "@prisma/client"
import { Inject, forwardRef } from "@nestjs/common"

// TODO after BH, remove unnecessary Inject, refact update too

abstract class ChanElement {

    protected readonly abstract chansService: ChansService
    protected readonly abstract chanId: string
    protected readonly abstract element: ChanDiscussionElementPayload

    public notifyByUsers = async (users: { name: string }[]) =>
        this.notifyByNames(users.map(user => user.name))

    public notifyByNames = async (users: string[]) =>
    (Promise.all(users.map(name => this.element && this.chansService.sse.pushEvent(name, {
        type: 'CREATED_CHAN_ELEMENT',
        data: {
            chanId: this.chanId,
            element: this.chansService.
                formatChanDiscussionElementForUser(name, this.element)
        }
    }))))

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
        protected readonly chansService: ChansService
    ) {
        super()
        this.element = element as ChanDiscussionElementMessageWithDeletedPayload
    }

    formatted = (username?: string) =>
    (this.chansService.formatChanDiscussionMessageForUser(
        username || this.element.authorName,
        this.element
    ))

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
        [ eventType, concerned ]:
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
        })), this.chanId, this.chansService)
    }

}
