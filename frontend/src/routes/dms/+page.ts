import { PUBLIC_BACKEND_URL } from "$env/static/public"
import { fetchGet } from "$lib/global"
import type { LoadEvent } from "@sveltejs/kit"

export const load = async ({ depends }: LoadEvent) => {
	const api_get_discussions = "/api/dms/me"
	try {
		const res1 = await fetchGet(api_get_discussions)
		const discussions = await res1.json()
		console.log("Loaded", PUBLIC_BACKEND_URL + api_get_discussions, discussions)

		depends(":discussions")
		return {
			discussions,
		}
	} catch (e: any) {
		console.error("Failed to load data:", e)
	}
}
