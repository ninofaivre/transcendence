import type { PageLoadEvent } from "./$types"
import { client } from "$clients"
import { checkError } from "$lib/global"

export const load = async ({ depends, params }: PageLoadEvent) => {
	depends(`app:dm:${params.dmId}`)
	const ret = await client.dms.getDmElements({
		params: {
			dmId: params.dmId,
		},
	})
	if (ret.status !== 200) checkError(ret, "load direct conversation messages")
	else {
		return { messages: ret.body }
	}
	return { messages: [] }
}
