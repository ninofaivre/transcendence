import { Prisma, AccessPolicyLevel as AccessPolicyLevelPrisma, ChanDiscussionEvent, ChanDiscussionElement } from "@prisma/client"
import { PrismaService } from "./prisma/prisma.service"

// TODO retype of password and of title by type of chan. commit ref: <600d73f6e2c998c19f4560b825f5e5203abadd61>

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

// TODO: Event => DmEvent
export type EventUnion =
	| "classicDmDiscussionEvent"
	| "chanInvitationDmDiscussionEvent"
	| "deletedMessageDmDiscussionEvent"
	| "blockedDmDiscussionEvent"
;(eventUnion: EventUnion) => eventUnion satisfies keyof Prisma.DmDiscussionEventSelect

export type RetypedEvent<T extends Record<EventUnion, any>> =
	transformObjectToUnionOfObjectWithOnlyOnePropertyOfUnionNotNull<T, EventUnion>

// TODO: Element => DmElement
export type ElementUnion = "event" | "message"
;(elementUnion: ElementUnion) => elementUnion satisfies keyof Prisma.DmDiscussionElementSelect

export type ChanEventUnion =
    | "classicChanDiscussionEvent"
    | "changedTitleChanDiscussionEvent"
    | "deletedMessageChanDiscussionEvent"
;(eventUnion: ChanEventUnion) => eventUnion satisfies keyof Prisma.ChanDiscussionEventSelect

export type ChanElementUnion = "event" | "message"
;(elementUnion: ChanElementUnion) => elementUnion satisfies keyof Prisma.ChanDiscussionElementSelect

export type ChanRetypedEventTest<T> = T extends Record<ChanEventUnion, any>
    ? transformObjectToUnionOfObjectWithOnlyOnePropertyOfUnionNotNull<T, ChanEventUnion>
    : T

export type ChanRetypedMessageTest<T> = T extends Record<"relatedTo", any>
    ? Omit<T, "relatedTo"> & Record<"relatedTo", ChanRetypedElementTest<T['relatedTo']>>
    : T

export type ChanRetypedElementTest<T> = T extends Record<"event" | "message", any>
    ? transformObjectToUnionOfObjectWithOnlyOnePropertyOfUnionNotNull<
            (Omit<T, "event" | "message"> & { event: ChanRetypedEventTest<Exclude<T['event'], null>> | null, message: T['message'] }),
            "event" | "message"
        >
    : T extends Record<"event", any>
        ? Omit<T, "event"> & Record<"event", ChanRetypedEventTest<T['event']>>
        : T extends Record<"message", any>
            ? Omit<T, "message"> & Record<"message", ChanRetypedMessageTest<T['message']>>
            : T

export type RetypedElement<T extends Record<ElementUnion, any>> =
	transformObjectToUnionOfObjectWithOnlyOnePropertyOfUnionNotNull<T, ElementUnion>

export type ChanRetypedEvent<T extends Record<ChanEventUnion, any>> =
	transformObjectToUnionOfObjectWithOnlyOnePropertyOfUnionNotNull<T, ChanEventUnion>

export type ChanRetypedElement<T extends Record<ChanElementUnion, any>> =
	transformObjectToUnionOfObjectWithOnlyOnePropertyOfUnionNotNull<T, ChanElementUnion>

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
