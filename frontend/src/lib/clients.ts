// client.ts

import { initClient, tsRestFetchApi } from "@ts-rest/core"

import { PUBLIC_BACKEND_URL as baseUrl } from "$env/static/public"

import { contract, isErrorCode } from "contract"
import { logged_in } from "$lib/stores"
import { sseId } from "$lib/stores"
import { get } from "svelte/store"

export const client = initClient(contract, {
	baseUrl,
	baseHeaders: {
		"sse-id": get(sseId),
	},
	jsonQuery: true,
	credentials: "include",
	api: async (args) => {
		const ret = await tsRestFetchApi(args)

		const { path } = args

		// perform checks for incorrect status, here body is unknown. It could be
		// a contract error or some response from nest not defined in the contract
		if (
			ret.status === 401 &&
			// protect infinite loop against logout incase you trigger logout by mistake
			!path.endsWith("logout") &&
			!path.endsWith("refreshTokens")
		) {
			const { status } = await client.auth.refreshTokens({ body: null })
			if (status === 200) return tsRestFetchApi(args)
			else logged_in.set(false)
		}

		// perform checks for ret as contractError so we can have even more
		// precise handling with Code instead of just status
		if (isErrorCode(ret, "TwoFATokenNeeded")) {
			logged_in.set(false)
		} else if (isErrorCode(ret, "NotFoundUserForValidToken")) {
			logged_in.set(false)
		} // there is a chance of getting a 404 here but I guess we don't care
		return ret
	},
})
