import type { PageLoad } from "./$types"
import { client } from "$clients"
import { checkError } from "$lib/global"

export const load: PageLoad = async ({ params }) => {
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
	if (user.status !== 200) checkError(user, "load user information")
	else if (match_history.status !== 200)
		checkError(match_history, "load user's match_history information")
	else {
		const ret = {
			user: user.body,
			match_history: match_history.body,
		}
		return ret
	}
	return { user: {} as Record<string, any>, match_history: [] }
}
