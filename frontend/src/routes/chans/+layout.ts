import type { LayoutLoad, LayoutLoadEvent } from "./$types"
import { client } from "$clients"

export const load = async ({ depends }: LayoutLoadEvent) => {
	console.log("layout load function from chans/ ")
	depends(":chans")
	const { status, body: chanList } = await client.chans.getMyChans()
	if (status !== 200) {
		console.log(
			`Failed to load channel list. Server returned code ${status} with message \"${
				(chanList as any)?.message
			}\"`,
		)
	}

	return { chanList }
}
