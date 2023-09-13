import { Prisma, AccessPolicyLevel as AccessPolicyLevelPrisma, ChanDiscussionEvent, ChanDiscussionElement } from "@prisma/client"
import { PrismaService } from "./prisma/prisma.service"
import { Request } from 'express'
import { ExecutionContext, createParamDecorator } from "@nestjs/common"

export interface EnrichedRequest extends Request {
    user: {
        username: string,
        intraUserName: string
        sseId?: string
    }
}

export const EnrichedRequest = createParamDecorator((data: never, ctx: ExecutionContext): EnrichedRequest => {
    const req: EnrichedRequest = ctx.switchToHttp().getRequest()
    const sseId = req.headers['sse-id']
    if (typeof sseId === "string")
        req.user['sseId'] = sseId
    return req
})

export type Tx = Omit<
	PrismaService,
	| "$connect"
	| "$disconnect"
	| "$on"
	| "$transaction"
	| "$use"
	| "onModuleInit"
	| "enableShutdownHooks"
	| "$extends"
>

// Example :
// transformObjectToUnionOfObjectWithOnlyOnePropertyOfUnionNotNull<{a: string, b: number, random: Date}, "a" | "b">
// ==> { a: string, b: null, random: Date } | { a: null, b: number, random: Date }
type transformObjectToUnionOfObjectWithOnlyOnePropertyOfUnionNotNull<
	T extends object,
	K extends keyof T,
> = {
	[k in K]: Omit<T, K> & (Record<Exclude<K, k>, null> & { [index in k]: Exclude<T[k], null> }) // could remove that line but null is more in the prisma spirit than undefined
}[K]

export type EventUnion =
	| "classicDmDiscussionEvent"
	| "chanInvitationDmDiscussionEvent"
	| "deletedMessageDmDiscussionEvent"
	| "blockedDmDiscussionEvent"
;(eventUnion: EventUnion) => eventUnion satisfies keyof Prisma.DmDiscussionEventSelect

export type RetypedEvent<T extends Record<EventUnion, any>> =
	transformObjectToUnionOfObjectWithOnlyOnePropertyOfUnionNotNull<T, EventUnion>

export type RetypedElement<T extends Record<ElementUnion, any>> =
	transformObjectToUnionOfObjectWithOnlyOnePropertyOfUnionNotNull<T, ElementUnion>

export type ElementUnion = "event" | "message"
;(elementUnion: ElementUnion) => elementUnion satisfies keyof Prisma.DmDiscussionElementSelect




export type ChanEventUnion =
    | "classicChanDiscussionEvent"
    | "changedTitleChanDiscussionEvent"
    | "deletedMessageChanDiscussionEvent"
    | "mutedUserChanDiscussionEvent"
;(eventUnion: ChanEventUnion) => eventUnion satisfies keyof Prisma.ChanDiscussionEventSelect

export type ChanElementUnion = "event" | "message"
;(elementUnion: ChanElementUnion) => elementUnion satisfies keyof Prisma.ChanDiscussionElementSelect

type RetypeChanEvent<T> = T extends Record<ChanEventUnion, unknown>
    ? transformObjectToUnionOfObjectWithOnlyOnePropertyOfUnionNotNull<T, ChanEventUnion>
    : T

type RetypeChanMessage<T> = T extends Record<"related", (Record<ChanElementUnion, unknown> | null)>
    ? Omit<T, "related"> & (Record<"related", RetypeChanElement<Exclude<T['related'], null>> | null>)
    : T

export type RetypeChanEventInElement<T extends Record<"event", unknown>> =
    Omit<T, "event"> & Record<"event", (RetypeChanEvent<Exclude<T['event'], null>> | null)>

export type RetypeChanMessageInElement<T extends Record<"message", unknown>> =
    Omit<T, "message"> & Record<"message", (RetypeChanMessage<Exclude<T['message'], null>> | null)>

export type RetypeChanElement<T extends Record<ChanElementUnion, unknown>> =
    transformObjectToUnionOfObjectWithOnlyOnePropertyOfUnionNotNull<
        RetypeChanEventInElement<RetypeChanMessageInElement<T>>,
        ChanElementUnion
    >

export const ProximityLevel = {
    BLOCKED: -1,
    ANYONE: 0,
    COMMON_CHAN: 1,
    FRIEND: 2
} as const

export const AccessPolicyLevel = {
    ANYONE: 0,
    IN_COMMON_CHAN: 1,
    ONLY_FRIEND: 2,
    NO_ONE: 3
} as const satisfies { [key in keyof typeof AccessPolicyLevelPrisma]: number }
