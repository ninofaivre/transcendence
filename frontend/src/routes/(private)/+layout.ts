import type { LayoutLoadEvent } from "./$types"
import { client } from "$clients"
import { checkError } from "$lib/global"

export const load = async ({ depends }: LayoutLoadEvent) => {
	console.log("layout load function from root/(private) layout")

	// load
	depends(":me")
	const me_res = await client.users.getMe()
	depends(":friends")
	const friendships_res = await client.friends.getFriends()

	// Check
	if (friendships_res.status !== 200) {
		checkError(friendships_res, "load friendships")
	} else if (me_res.status != 200) checkError(me_res, "get current user's name")
	else {
		let friendList: string[] = friendships_res.body.map((friendship) => friendship.friendName)
		return { friendships: friendships_res.body, friendList, me: me_res.body }
	}
	return { me: {} as Record<string, any>, friendships: [], friendList: [] }
}
