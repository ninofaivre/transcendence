// client.ts

import { initClient, tsRestFetchApi } from "@ts-rest/core"

import { PUBLIC_BACKEND_URL as baseUrl } from "$env/static/public"
import { logout } from "./global"

// import * as contract_module from "contract/src/index"
// const { contract } = contract_module

import { contract, isContractError } from "contract"

export const client = initClient(contract, {
	baseUrl,
	baseHeaders: {},
	jsonQuery: true,
	credentials: "include",
	api: async (args) => {
		const ret = await tsRestFetchApi(args)
		if (isContractError(ret)) {
			if (ret.status === 401) {
				// const success = await refreshToken()
				const success = true
				if (success) return ret
				logout()
			} else if (ret.body.code === "NotFoundUserForValidToken") {
				logout()
			}
		}
		return ret
	},
})
