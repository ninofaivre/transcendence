// client.ts

import { initClient } from "@ts-rest/core"

import { PUBLIC_BACKEND_URL as baseUrl } from "$env/static/public"

import { chansContract } from "../../../contract/routers/chans"
export const chansClient = initClient(chansContract, {
	baseUrl,
	baseHeaders: {},
})

import { dmsContract } from "../../../contract/routers/dms"
export const dmsClient = initClient(dmsContract, {
	baseUrl,
	baseHeaders: {},
})

import { invitationsContract } from "../../../contract/routers/invitations"
export const invitationsClient = initClient(invitationsContract, {
	baseUrl,
	baseHeaders: {},
})

import { friendsContract } from "../../../contract/routers/friends"
export const friendsClient = initClient(friendsContract, {
	baseUrl,
	baseHeaders: {},
})

import { usersContract } from "../../../contract/routers/users"
export const usersClient = initClient(usersContract, {
	baseUrl,
	baseHeaders: {},
})
