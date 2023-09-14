import type { PageLoad } from "./$types"
import { client } from "$clients"
import { checkError } from "$lib/global"

export const load: PageLoad = async ({ params, depends }) => {
	console.log("[username] page load")
	depends("app:user")

	const user = await client.users.getUser({
		params: {
			userName: params.username,
		},
	})
	const match_history = await client.game.getMatchHistory({
		params: {
			username: params.username,
		},
	})
	const chan_invites = await client.invitations.chan.getChanInvitations({
		query: { status: ["PENDING"] },
	})

	const friend_requests = await client.invitations.friend.getFriendInvitations({
		query: { status: ["PENDING"] },
	})
	if (user.status !== 200) checkError(user, "load user information")
	else if (match_history.status !== 200)
		checkError(match_history, "load user's match_history information")
	else if (friend_requests.status !== 200)
		checkError(friend_requests, "load user's friend invitations")
	else if (chan_invites.status !== 200) checkError(chan_invites, "load user's friend invitations")
	else {
		const ret = {
			user: user.body,
			match_history: match_history.body,
			friend_requests: friend_requests.body,
			chan_invites: chan_invites.body,
		}
		return ret
	}
	return {
		user: {} as Record<string, any>,
		match_history: [],
		friend_requests: { incoming: [], outcoming: [] },
		chan_invites: { incoming: [], outcoming: [] },
	}
}
