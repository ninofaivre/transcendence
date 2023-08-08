import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { ClassicChanEventType } from '@prisma/client'
import { PrismaService } from 'src/prisma/prisma.service';
import { ChanDiscussionElementPayload, ChansService } from '../chans.service';

@Injectable()
export class EventsService {
    
    constructor(
		private readonly prisma: PrismaService,
        @Inject(forwardRef(() => ChansService))
        private readonly chansService: ChansService
    ) {}

    public createClassicChanEvent = async (
        chanId: string, event: ClassicChanEventType,
        author: string, concerned?: string,
    ) => (this.prisma.chanDiscussionElement.create({
        data: {
            author: { connect: { name: author } },
            chan: { connect: { id: chanId } },
            event: {
                create: {
                    classicChanDiscussionEvent: { create: { eventType: event } },
                    ...(concerned
                        ? { concernedUser: { connect: { name: concerned } } }
                        : {})
                }
            },
        },
        select: this.chansService.chanDiscussionElementsSelect
    }) as Promise<ChanDiscussionElementPayload>)

    public createMutedUserChanEvent = async (
        chanId: string, author: string,
        concerned: string, timeoutInMs?: number
    ) => (this.prisma.chanDiscussionElement.create({
            data: {
                author: { connect: { name: author } },
                chan: { connect: { id: chanId } },
                event: {
                    create: {
                        mutedUserChanDiscussionEvent :{
                            create: {
                                mutedUser: { connect: { name: concerned } },
                                ...(timeoutInMs
                                    ? { timeoutInMs : timeoutInMs }
                                    : {})
                            }
                        }
                    }
                }
            },
            select: this.chansService.chanDiscussionElementsSelect
        }) as Promise<ChanDiscussionElementPayload>)
}
