import type {
	Chan,
	ChanInvitations,
	ChanMessage,
	DirectConversation,
	DirectMessageOrEvent,
	FriendInvitations,
	Friendship,
} from "$types"
import { localStorageStore } from "@skeletonlabs/skeleton"
import type { Writable } from "svelte/store"
import { readable, writable } from "svelte/store"

console.log("The stores module is being executed...")

export const logged_in = localStorageStore("logged", false)

export const reload_img = writable({ trigger: Date.now(), id: "" })

export const dms_store: Writable<DirectConversation[]> = writable([])
export const chans_store: Writable<Chan[]> = writable([])
export const dm_messages_store: Writable<DirectMessageOrEvent[]> = writable([])
export const chans_messages_store: Writable<ChanMessage[]> = writable([])
export const friendships_store: Writable<Friendship[]> = writable([])
export const friendship_requests_store: Writable<FriendInvitations> = writable({
	incoming: [],
	outcoming: [],
})
export const chan_invitations_store: Writable<ChanInvitations> = writable({
	incoming: [],
	outcoming: [],
})

export const sseId = readable(Date.now().toString())
