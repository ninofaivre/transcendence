import { derived, writable } from "svelte/store"

import { fetchGet } from "$lib/global"
import { localStorageStore } from "@skeletonlabs/skeleton"

console.log("The stores module is being executed...")

export const logged_in = localStorageStore("logged", false)

export const my_name = derived(
	logged_in,
	($logged_in, set) => {
		if ($logged_in === true) {
			fetchGet("/api/user/myName")
				.then((r) => r.json())
				.then(({ data: name }) => {
					console.log("Welcome back, " + name)
					set(name)
				})
				.catch((err: any) => {
					console.error("Failed to fetch user's name", err)
				})
		} else set("Anonymous")
	},
	"Anonymous",
)

let eventSource: EventSource | undefined
export const sse_store = derived(logged_in, ($logged_in) => {
	if ($logged_in === true) {
		let new_es = new EventSource("/api/sse")
		new_es.onopen = function (_evt) {
			console.log("Successfully established sse connection")
			eventSource = new_es
		}
		new_es.onerror = function (evt) {
			console.log("Error while openning new sse connection: Probably already in use")
		}
	} else {
		console.log("Closing eventSource...")
		eventSource?.close()
	}
	return eventSource
})

// type SseDataType = {
// 	dm_messages: string[]
// 	room_messages: string[]
// 	dm_list: Discussion[]
// 	room_list: Discussion[]
// }
// export const create_sse_store = function () {
// 	let eventSource: EventSource

// 	const { subscribe, update }: Writable<SseDataType> = writable(
// 		{
// 			dm_list: [],
// 			dm_messages: [],
// 			room_messages: [],
// 			room_list: [],
// 		},
// 		() => {
// 			if (browser) init()
// 			return () => {
// 				eventSource?.close()
// 				console.log("Closing Eventsource...")
// 			}
// 		},
// 	)

// 	function init() {
// 		eventSource = new EventSource("/api/sse")

// 		eventSource.addEventListener("CHAN_NEW_MESSAGE", ({ data }) => {
// 			add_new_room_message(JSON.parse(data))
// 		})
// 		eventSource.addEventListener("DM_NEW_MESSAGE", ({ data }) => {
// 			add_new_dm_message(JSON.parse(data))
// 		})
// 	}

// 	function add_new_room_message(new_message: string) {
// 		update((value) => {
// 			return { ...value, room_messages: [...value.room_messages, new_message] }
// 		})
// 	}

// 	function add_new_room(new_room: Discussion) {
// 		update((value) => {
// 			return { ...value, room_list: [...value.room_list, new_room] }
// 		})
// 	}

// 	function add_new_dm_message(new_message: string) {
// 		update((value) => {
// 			return { ...value, dm_messages: [...value.dm_messages, new_message] }
// 		})
// 	}

// 	function add_new_dm(new_dm: Discussion) {
// 		update((value) => {
// 			return { ...value, dm_list: [...value.dm_list, new_dm] }
// 		})
// 	}

// 	return { subscribe, update, add_new_room, add_new_room_message, add_new_dm, add_new_dm_message }
// }
