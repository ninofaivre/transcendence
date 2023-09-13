import type { LayoutLoadEvent } from "./$types"
import { client } from "$clients"
import { checkError } from "$lib/global"
import type { Friendship } from "$types"

export const load = async ({ depends }: LayoutLoadEvent) => {
	console.log("layout load function from root/(private) layout")

	// load
	const me_res = await client.users.getMe()
	depends("app:me")
	depends("app:friends")
	depends("app:friendships")
	const friendships_res = await client.friends.getFriends()

	// Check
	if (friendships_res.status !== 200) {
		checkError(friendships_res, "load friendships")
	} else if (me_res.status != 200) checkError(me_res, "get current user's name")
	else {
		let friendList: string[] = friendships_res.body.map((friendship) => friendship.friendName)
		return { friendships: friendships_res.body, friendList, me: me_res.body }
	}
	return {
		me: {} as Record<string, any>,
		friendships: [] as Friendship[],
		friendList: [] as string[],
	}
}
