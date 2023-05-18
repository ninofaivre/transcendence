// client.ts

import { initClient } from "@ts-rest/core"

import { PUBLIC_BACKEND_URL as baseUrl } from "$env/static/public"

import { chansContract } from "$contracts/chans"
export const chansClient = initClient(chansContract, {
	baseUrl,
	baseHeaders: {},
})

import { dmsContract } from "$contracts/dms"
export const dmsClient = initClient(dmsContract, {
	baseUrl,
	baseHeaders: {},
})

import { invitationsContract } from "$contracts/invitations"
export const invitationsClient = initClient(invitationsContract, {
	baseUrl,
	baseHeaders: {},
})

import { friendsContract } from "$contracts/friends"
export const friendsClient = initClient(friendsContract, {
	baseUrl,
	baseHeaders: {},
})

import { usersContract } from "$contracts/users"
export const usersClient = initClient(usersContract, {
	baseUrl,
	baseHeaders: {},
})
