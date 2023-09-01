import type { PageLoad } from "./$types"
import { client } from "$clients"
import { checkError } from "$lib/global"
import { my_name } from "$stores"
import { get } from "svelte/store"

export const load: PageLoad = async ({}) => {
	const match_history = await client.game.getMatchHistory({
		params: {
			username: get(my_name),
		},
	})

	if (match_history.status !== 200)
		checkError(match_history, "load user's match_history information")
	else {
		const ret = {
			match_history: match_history.body,
		}
		return ret
	}
	return { user: {} as Record<string, any>, match_history: [] }
}
