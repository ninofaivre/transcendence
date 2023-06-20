import { Prisma } from "prisma-client"
import { PrismaService } from "./prisma/prisma.service"

export type Tx = Omit<PrismaService, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use">

type ExcludeProperty<T, K extends keyof T, V> = Omit<T, K> & { [P in K]: Exclude<T[K], V> };

export type IdontKnowHowToNameThisShit<T extends Object, K extends keyof T> = {
    [k in K]: Omit<T, K> & (Record<Exclude<K, k>, null> & ExcludeProperty<Pick<T, k>, k, null>);
}[K];

type EventUnion = "classicDmDiscussionEvent" | "chanInvitationDmDiscussionEvent" | "deletedMessageDmDiscussionEvent" | "blockedDmDiscussionEvent"

export type RetypedEvent<T extends Record<EventUnion, any>> =
    IdontKnowHowToNameThisShit<T, EventUnion>

type ElementUnion = "event" | "message"

export type RetypedElement<T extends Record<ElementUnion, any>> =
    IdontKnowHowToNameThisShit<T, ElementUnion>
