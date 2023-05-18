// client.ts

import { initClient } from "@ts-rest/core"

import { PUBLIC_BACKEND_URL as baseUrl } from "$env/static/public"

import contract from "$contract"

export const chansClient = initClient(contract.chans, {
	baseUrl,
	baseHeaders: {},
})

export const dmsClient = initClient(contract.dms, {
	baseUrl,
	baseHeaders: {},
})

export const invitationsClient = initClient(contract.invitations, {
	baseUrl,
	baseHeaders: {},
})

export const friendsClient = initClient(contract.friends, {
	baseUrl,
	baseHeaders: {},
})

export const usersClient = initClient(contract.users, {
	baseUrl,
	baseHeaders: {},
})
