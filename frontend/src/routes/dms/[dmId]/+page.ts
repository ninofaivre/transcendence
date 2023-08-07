import type { PageLoadEvent } from "./$types"
import type { PageLoad } from "./$types"
import { client } from "$lib/clients"

export const load = async ({ depends, params }: PageLoadEvent) => {
	console.log("dms/[dmId]/ page load")
	depends(`:dms${params.dmId}`)
	const { status, body: messages } = await client.dms.getDmElements({
		params: {
			dmId: params.dmId as string,
		},
	})
	if (status !== 200) {
		console.log(
			`Failed to load channel list. Server returned code ${status} with message \"${
				(messages as any)?.message
			}\"`,
		)
	}

	// console.log("Your messages:", messages)
	return { messages }
}
