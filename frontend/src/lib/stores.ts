import { readable, writable, derived } from "svelte/store"
import { fetchGet } from "$lib/global"

// export const logged_in = writable(false)
//
export const logged_in = writable(false)

export const my_name = derived(logged_in, async ($logged_in) => {
	if ($logged_in === true) {
		return await fetchGet("/api/user/myName")
	} else return "Anonymous"
})
