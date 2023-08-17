export const ssr = false

import type { LayoutLoad, LayoutLoadEvent } from "./$types"
import { client } from "$clients"

export const load = async ({ depends }: LayoutLoadEvent) => {
	console.log("layout load function from root layout")
	depends(":friends")
	const { status: status2, body: friendships } = await client.friends.getFriends()
	let friendList: string[] = []
	if (status2 === 200) {
		friendList = friendships.map((friendship) => friendship.friendName)
	} else {
		console.log(
			`Failed to load friend list. Server returned code ${status2} with message \"${
				(friendships as any)?.message
			}\"`,
		)
	}
	return { friendships, friendList }
}
