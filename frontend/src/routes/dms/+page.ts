import type { LoadEvent } from "@sveltejs/kit"
import { dmsClient } from "$lib/clients"

export const load = async ({ depends }: LoadEvent) => {
	depends(":dms")

	const { status, body: dms } = await dmsClient.getDms()
	if (status !== 200) {
		console.log(
			`Failed to load channel list. Server returned code ${status} with message \"${
				(dms as any)?.message
			}\"`,
		)
	}

	return { dms }
}
