import { Prisma } from "prisma-generated"
import { PrismaService } from "./prisma/prisma.service"

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
	[k in K]: Omit<T, K> &
		(Record<Exclude<K, k>, null> & { [index in k]: Exclude<T[k], null> }) // could remove that line but null is more in the prisma spirit than undefined
}[K]

export type EventUnion =
	| "classicDmDiscussionEvent"
	| "chanInvitationDmDiscussionEvent"
	| "deletedMessageDmDiscussionEvent"
	| "blockedDmDiscussionEvent"
;(eventUnion: EventUnion) => eventUnion satisfies keyof Prisma.DmDiscussionEventSelect

export type RetypedEvent<T extends Record<EventUnion, any>> =
	transformObjectToUnionOfObjectWithOnlyOnePropertyOfUnionNotNull<T, EventUnion>

export type ElementUnion = "event" | "message"
;(elementUnion: ElementUnion) => elementUnion satisfies keyof Prisma.DmDiscussionElementSelect

export type RetypedElement<T extends Record<ElementUnion, any>> =
	transformObjectToUnionOfObjectWithOnlyOnePropertyOfUnionNotNull<T, ElementUnion>
