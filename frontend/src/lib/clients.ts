// client.ts

import { initClient } from "@ts-rest/core"

import { PUBLIC_BACKEND_URL as baseUrl } from "$env/static/public"

import { contract } from "contract"

export const client = initClient(contract, {
	baseUrl,
	baseHeaders: {},
    jsonQuery: true,
})
