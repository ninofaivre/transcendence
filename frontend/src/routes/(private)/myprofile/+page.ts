import type { PageLoad } from "./$types"
import { client } from "$clients"
import { checkError } from "$lib/global"

export const load: PageLoad = async ({ parent, depends }) => {

    depends("app:match_history")
	let { me } = await parent()

	const match_history = await client.game.getMatchHistory({
		params: {
			username: me.userName,
		},
	})

	const user = await client.users.getUser({
		params: {
			userName: me.userName,
		},
	})

	if (user.status !== 200 || match_history.status !== 200) {
		checkError(
			user.status !== 200 ? user : match_history,
			"load user's match_history information",
		)
	} else {
		return {
			match_history: match_history.body,
			user: user.body,
		}
	}
	return { user: {} as Record<string, any>, match_history: [] }
}
