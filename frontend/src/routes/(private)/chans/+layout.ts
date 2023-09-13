import type { LayoutLoad, LayoutLoadEvent } from "./$types"
import { client } from "$clients"
import { checkError } from "$lib/global"

export const load = async ({ depends }: LayoutLoadEvent) => {
	console.log("layout load function from chans/ ")

	depends("app:chans")
	const ret = await client.chans.getMyChans()

	if (ret.status !== 200) {
		checkError(ret, "load channel list")
		return { chanList: [] }
	} else return { chanList: ret.body }
}
