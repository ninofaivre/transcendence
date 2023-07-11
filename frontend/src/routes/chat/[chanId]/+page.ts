import type { PageLoadEvent } from "./$types"
import type { PageLoad } from "./$types"
import { client }  from "$clients"

export const load = async ({ depends, params }: PageLoadEvent) => {
	depends(`:dms${params.chanId}`)
	const { status, body: messages } = await client.chans.getChanElements({
		params: {
			chanId: params.chanId as string,
		},
	})
	if (status !== 200) {
		console.log(
			`Failed to load channel list. Server returned code ${status} with message \"${
				(messages as any)?.message
			}\"`,
		)
	}

	console.log("Your messages:", messages)
	return { messages }
}
