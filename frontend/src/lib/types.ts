import type { ClientInferResponseBody } from "@ts-rest/core"

import type {contract} from "contract"

type Flatten<T> = T extends any[] ? T[number] : T

export type Chans = ClientInferResponseBody<typeof contract.chans.getMyChans, 200>
export type Chan = Flatten<Chans>

export type ChanMessages = ClientInferResponseBody<typeof contract.chans.getChanElements, 200>
export type ChanMessage = Flatten<ChanMessages>

export type DirectConversations = ClientInferResponseBody<typeof contract.dms.getDms, 200>
export type DirectConversation = Flatten<DirectConversations>

export type DirectMessagesOrEvents = ClientInferResponseBody<typeof contract.dms.getDmElements, 200>
export type DirectMessageOrEvent = Flatten<DirectMessagesOrEvents>
export type DirectMessage = Extract<DirectMessageOrEvent, {type: "message"}>

export type Friendships = ClientInferResponseBody<typeof contract.friends.getFriends, 200>
export type Friendship = Flatten<Friendships>
