import type { LayoutLoad } from "./$types.d"
import { getCookie } from "$lib/global"
import { logged_in } from "$lib/stores"

export const ssr = false

export const load = (async ({}) => {
	// Are we logged yet ?
	if (getCookie("access_token")) logged_in.set(true)
}) satisfies LayoutLoad
