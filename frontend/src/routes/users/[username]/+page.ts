import type { PageLoad } from "./$types"
import { client } from "$clients"

export const load: PageLoad = async ({ params }) => {
	const user = await client.users.getUser({
		params: {
			userName: params.username,
		},
	})

	// const match_history = client.users.getMatchHistory({
	// 	params: {
	// 		userName: params.username,
	// 	},
	// })
	// return { user, match_history}

	return { user, username: params.username }
}
