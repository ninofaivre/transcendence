import { initContract } from "@ts-rest/core"
import { zUserName } from "../zod/user.zod"
import { z } from "zod"
import { unique } from "../zod/global.zod"
import { zChanTitle } from "./chans"

const c = initContract()

const zChanInvitationStatus = z.enum([
	"PENDING",
	"ACCEPTED",
	"REFUSED",
	"CANCELED",
	"DELETED_CHAN",
	"BLOCKED_USER",
	"BANNED_FROM_CHAN",
])
const zFriendInvitationStatus = z.enum([
	"PENDING",
	"ACCEPTED",
	"REFUSED",
	"CANCELED",
	"BLOCKED_USER",
])

export const zFriendInvitationReturn = z.strictObject({
	id: z.string().uuid(),
	creationDate: z.date(),
	invitingUserName: zUserName,
	invitedUserName: zUserName,
	status: zFriendInvitationStatus,
})

export const zChanInvitationReturn = z.strictObject({
	id: z.string().uuid(),
	chanId: z.string().uuid().nullable(),
	chanTitle: zChanTitle.nullable(),
	status: zChanInvitationStatus,
	invitedUserName: zUserName,
	invitingUserName: zUserName,
})

const friendInvitationsContract = c.router(
	{
		getFriendInvitations: {
			method: "GET",
			path: "/",
			query: z.strictObject({
				status: unique(z.array(zFriendInvitationStatus)).default(["PENDING"]),
			}),
			responses: {
				200: z.strictObject({
					incoming: z.array(zFriendInvitationReturn),
					outcoming: z.array(zFriendInvitationReturn),
				}),
			},
		},
		getFriendInvitationById: {
			method: "GET",
			path: "/:id",
			pathParams: z.strictObject({
				id: z.string().uuid(),
			}),
			responses: {
				200: zFriendInvitationReturn,
			},
		},
		createFriendInvitation: {
			method: "POST",
			path: `/`,
			body: z.strictObject({
				invitedUserName: zUserName,
			}),
			responses: {
				201: zFriendInvitationReturn,
			},
		},
		updateFriendInvitation: {
			method: "PATCH",
			path: `/:id`,
			pathParams: z.strictObject({
				id: z.string().uuid(),
			}),
			body: z.strictObject({
				status: zFriendInvitationStatus.extract(["ACCEPTED", "REFUSED", "CANCELED"]),
			}),
			responses: {
				200: zFriendInvitationReturn,
			},
		},
	},
	{
		pathPrefix: "/friend",
	},
)

const chanInvitationsContract = c.router(
	{
		getChanInvitations: {
			method: "GET",
			path: "/",
			query: z.strictObject({
				status: unique(z.array(zChanInvitationStatus)).default(["PENDING"]),
			}),
			responses: {
				200: z.strictObject({
					incoming: z.array(zChanInvitationReturn),
					outcoming: z.array(zChanInvitationReturn),
				}),
			},
		},
		getChanInvitationById: {
			method: "GET",
			path: "/:id",
			pathParams: z.strictObject({
				id: z.string().uuid(),
			}),
			responses: {
				200: zChanInvitationReturn,
			},
		},
		createChanInvitation: {
			method: "POST",
			path: `/`,
			body: z.strictObject({
				invitedUserName: zUserName,
				chanId: z.string().uuid(),
			}),
			responses: {
				201: zChanInvitationReturn,
			},
		},
		updateChanInvitation: {
			method: "PATCH",
			path: `/:id`,
			pathParams: z.strictObject({
				id: z.string().uuid(),
			}),
			body: z.strictObject({
				status: zChanInvitationStatus.extract(["ACCEPTED", "REFUSED", "CANCELED"]),
			}),
			responses: {
				200: zChanInvitationReturn,
			},
		},
	},
	{
		pathPrefix: "/chan",
	},
)

export const invitationsContract = c.router(
	{
		friend: friendInvitationsContract,
		chan: chanInvitationsContract,
	},
	{
		pathPrefix: "/invitations",
	},
)

type FriendInvitationEvent = {
	type: "CREATED_FRIEND_INVITATION" | "UPDATED_FRIEND_INVITATION"
	data: z.infer<typeof zFriendInvitationReturn>
}

type ChanInvitationEvent = {
	type: "CREATED_CHAN_INVITATION" | "UPDATED_CHAN_INVITATION"
	data: z.infer<typeof zChanInvitationReturn>
}

export type InvitationEvent = FriendInvitationEvent | ChanInvitationEvent