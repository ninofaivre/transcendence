import type { PageLoadEvent } from "./$types"
import type { PageLoad } from "./$types"
import { client } from "$lib/clients"

export const load = async ({ depends, params, parent }: PageLoadEvent) => {
	console.log("chans/[chanId]/ page load")

	depends(`:chan:${params.chanId}`)

	let { chanList } = await parent()

	const chan = chanList.find((el) => el.id === params.chanId)

	const { status, body: messages } = await client.chans.getChanElements({
		params: {
			chanId: params.chanId,
		},
	})
	if (status !== 200) {
		console.log(
			`Failed to load channel list. Server returned code ${status} with message \"${(
				messages as any
			)?.message}\"`,
		)
		return { messages: [] }
	}
	return { messages, chan }
}
