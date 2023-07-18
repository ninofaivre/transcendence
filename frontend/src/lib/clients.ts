// client.ts

import { initClient } from "@ts-rest/core"

import { PUBLIC_BACKEND_URL as baseUrl } from "$env/static/public"

// import * as contract_module from "contract/src/index"
// const { contract } = contract_module

import { contract } from "contract"

export const client = initClient(contract, {
	baseUrl,
	baseHeaders: {},
	jsonQuery: true,
	credentials: "include",
})
