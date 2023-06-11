import type { LoadEvent } from "@sveltejs/kit"
import { friendsClient } from "$clients"

export const load = async ({ depends }: LoadEvent) => {
	const ret: any = {}
	{
		const { status, body } = await friendsClient.getFriends()
		if (status !== 200) {
			console.log(
				`Failed to load friend list. Server returned code ${status} with message \"${
					(body as any)?.message
				}\"`,
			)
		} else ret.friends = body
		depends(":friends")
	}
	return ret
}
