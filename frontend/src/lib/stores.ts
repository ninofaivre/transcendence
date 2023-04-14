import { writable, derived } from "svelte/store"
import { fetchGet } from "$lib/global"
import { localStorageStore } from "@skeletonlabs/skeleton"

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
