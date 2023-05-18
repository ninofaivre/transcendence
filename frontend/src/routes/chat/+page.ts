import { PUBLIC_BACKEND_URL } from "$env/static/public"
import { fetchGet } from "$lib/global"
import type { LoadEvent } from "@sveltejs/kit"
import { chansClient } from "$lib/clients"

export const load = async ({ depends }: LoadEvent) => {
	try {
		const { status, body } = await chansClient.getMyChans()
		console.log("load: ", status, body)

		depends(":discussions")
		return {
			discussions: body,
		}
		// return new Promise(() => body)
	} catch (e: any) {
		console.error("Failed to load data:", e)
	}
}
