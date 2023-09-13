import type { LayoutLoad, LayoutLoadEvent } from "./$types"
import { client } from "$clients"

export const load = async ({ depends }: LayoutLoadEvent) => {
	console.log("layout load function from dms/ ")

	depends("app:dms")
	const { status, body: dmList } = await client.dms.getDms()
	if (status !== 200) {
		console.log(
			`Failed to load channel list. Server returned code ${status} with message \"${(
				dmList as any
			)?.message}\"`,
		)
		return { dmList: [] }
	} else return { dmList }
}
