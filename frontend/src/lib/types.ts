import type { ClientInferResponseBody } from "@ts-rest/core"

import type {contract} from "contract"

type Flatten<T> = T extends any[] ? T[number] : T

export type Chans = ClientInferResponseBody<typeof contract.chans.getMyChans, 200>
export type Chan = Flatten<Chans>

export type ChanMessages = ClientInferResponseBody<typeof contract.chans.getChanElements, 200>
export type ChanMessage = Flatten<ChanMessages>

export type Conversations = ClientInferResponseBody<typeof contract.dms.getDms, 200>
export type Conversation = Flatten<Conversations>

export type DirectMessages = ClientInferResponseBody<typeof contract.dms.getDms, 200>
export type DirectMessage = Flatten<DirectMessages>

export type Friendships = ClientInferResponseBody<typeof contract.friends.getFriends, 200>
export type Friendship = Flatten<Friendships>
