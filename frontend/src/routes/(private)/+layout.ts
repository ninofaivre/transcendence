export const ssr = false

import type { LayoutLoad, LayoutLoadEvent } from "./$types"
import { client } from "$clients"
import { checkError } from "$lib/global"

export const load = async ({ depends }: LayoutLoadEvent) => {
	console.log("layout load function from root/(private) layout")

	depends(":me")
	let me: string = "Anonymous"
	const me_res = await client.users.getMe()
	if (me_res.status != 200) checkError(me_res, "get current user's name")
	else me = me_res.body.userName

	depends(":friends")
	const { status: status2, body: friendships } = await client.friends.getFriends()
	let friendList: string[] = []
	if (status2 === 200) {
		friendList = friendships.map((friendship) => friendship.friendName)
	} else {
		console.log(
			`Failed to load friend list. Server returned code ${status2} with message \"${(
				friendships as any
			)?.message}\"`,
		)
	}
	return { friendships, friendList, me }
}
