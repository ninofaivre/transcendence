import type { LayoutLoad } from "./$types.d"
import { fetchGet } from "$lib/global"

export const ssr = false

export const load = (async ({}) => {
	const res = await fetchGet("/api/user/myName")
	const myName = await res.json()

	return { myName }
}) satisfies LayoutLoad
