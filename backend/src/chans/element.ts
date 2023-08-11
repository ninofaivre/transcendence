import { PrismaService } from "src/prisma/prisma.service"
import { ChanDiscussionElementEventWithoutDeletedPayload,
    ChanDiscussionElementPayload, ChansService } from "./chans.service"
import { ClassicChanEventType, Prisma } from "@prisma/client"
import { Inject, Injectable, forwardRef } from "@nestjs/common"
import { SseService } from "src/sse/sse.service"

class ChanElement {

    private readonly sse: SseService

    constructor(
        private readonly element: ChanDiscussionElementPayload,
        private readonly chanId: string,
        @Inject(forwardRef(() => ChansService))
        private readonly chansService: ChansService
    ) {
        this.sse = this.chansService.sse
    }

    public notify = async (users: string[]) =>
    (Promise.all(users.map(name => this.element && this.sse.pushEvent(name, {
        type: 'CREATED_CHAN_ELEMENT',
        data: {
            chanId: this.chanId,
            element: this.chansService.
                formatChanDiscussionElementForUser(name, this.element)
        }
    }))))

}

class ChanElementEvent extends ChanElement {

    private readonly event: ChanDiscussionElementEventWithoutDeletedPayload

    constructor(
        event: ChanDiscussionElementPayload,
        chanId: string,
        @Inject(forwardRef(() => ChansService))
        chansService: ChansService
    ) {
        super(event, chanId, chansService)
        this.event = event as ChanDiscussionElementEventWithoutDeletedPayload
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
                mutedUserChanDiscussionEvent :{
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

}
