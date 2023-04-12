import type { LayoutLoad } from "./$types.d"
import { getCookie } from "$lib/global"
import { logged_in } from "$lib/stores"
import { goto } from "$app/navigation"

export const ssr = false

export const load = (({}) => {
	console.log("load function called")
	if (getCookie("access_token")) logged_in.set(true)
}) satisfies LayoutLoad
