export type * as Types from "contract"

import type { client } from "$clients"
import type { ClientInferResponseBody } from "@ts-rest/core"

import type { contract } from "contract"
import type { Socket } from "socket.io-client"
import type { ClientToServerEvents, ServerToClientEvents } from "contract"

type Flatten<T> = T extends any[] ? T[number] : T

export type Chans = ClientInferResponseBody<typeof contract.chans.getMyChans, 200>
export type Chan = Flatten<Chans>

export type ChanMessagesOrEvents = ClientInferResponseBody<
	typeof contract.chans.getChanElements,
	200
>
export type ChanMessageOrEvent = Flatten<ChanMessagesOrEvents>
export type ChanMessage = Extract<ChanMessageOrEvent, { type: "message" }>

export type DirectConversations = ClientInferResponseBody<typeof contract.dms.getDms, 200>
export type DirectConversation = Flatten<DirectConversations>

export type DirectMessagesOrEvents = ClientInferResponseBody<typeof contract.dms.getDmElements, 200>
export type DirectMessageOrEvent = Flatten<DirectMessagesOrEvents>
export type DirectMessage = Extract<DirectMessageOrEvent, { type: "message" }>

export type MatchHistory = ClientInferResponseBody<typeof contract.game.getMatchHistory, 200>
export type MatchHistoryElement = Flatten<MatchHistory>

export type Message = ChanMessage | DirectMessage
export type MessageOrEvent = ChanMessageOrEvent | DirectMessageOrEvent
export type DeleteMessageFunction =
	| typeof client.chans.deleteChanMessage
	| typeof client.dms.deleteDmMessage
export type UpdateMessageFunction =
	| typeof client.chans.updateChanMessage
	| typeof client.dms.updateDmMessage
export type CreateMessageFunction =
	| typeof client.chans.createChanMessage
	| typeof client.dms.createDmMessage

export type Friendships = ClientInferResponseBody<typeof contract.friends.getFriends, 200>
export type Friendship = Flatten<Friendships>

export type FriendInvitations = ClientInferResponseBody<
	typeof contract.invitations.friend.getFriendInvitations,
	200
>

export type ChanInvitations = ClientInferResponseBody<
	typeof contract.invitations.chan.getChanInvitations,
	200
>

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>
