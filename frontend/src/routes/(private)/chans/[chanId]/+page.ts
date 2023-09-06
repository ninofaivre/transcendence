import type { PageLoadEvent } from "./$types"
import type { PageLoad } from "./$types"
import { client } from "$lib/clients"

export const load = async ({ depends, params }: PageLoadEvent) => {
	console.log("chans/[chanId]/ page load")
	depends(`:chans${params.chanId}`)
	const { status, body: messages } = await client.chans.getChanElements({
		params: {
			chanId: params.chanId,
		},
	})
	if (status !== 200) {
		console.log(
			`Failed to load channel list. Server returned code ${status} with message \"${
				(messages as any)?.message
			}\"`,
		)
        return { messages: [] }
	}
	return { messages }
}
