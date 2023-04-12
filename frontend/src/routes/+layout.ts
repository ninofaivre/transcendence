import type { LayoutLoad } from "./$types.d"

export const ssr = false

export const load = (({}) => {
	console.log("load function called")
}) satisfies LayoutLoad
