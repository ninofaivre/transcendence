import { localStorageStore } from "@skeletonlabs/skeleton"
import { get, writable } from "svelte/store"

console.log("The stores module is being executed...")

export const logged_in = localStorageStore("logged", false)

const num = 0
export const reload_img = writable(num)

export const dms_store = writable([])
export const chans_store = writable([])
export const dm_messages_store = writable([])
export const chans_messages_store = writable([])
export const friendships_store = writable([])
export const friendship_requests_store = writable([])
export const chan_invitations_store = writable([])
