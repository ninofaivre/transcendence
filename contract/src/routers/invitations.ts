import { initContract } from "@ts-rest/core"
import { zUserName } from "../zod/user.zod"
import { z } from "zod"
import { unique } from "../zod/global.zod"
import { zChanTitle } from "./chans"
import { zChanInvitationStatus, zFriendInvitationStatus } from "../generated-zod"

const c = initContract()

export const zFriendInvitationReturn = z.strictObject({
	id: z.string().uuid(),
	creationDate: z.date(),
	invitingUserName: zUserName,
    invitingDisplayName: zUserName,
	invitedUserName: zUserName,
    invitedDisplayName: zUserName,
	status: zFriendInvitationStatus,
})

export const zChanInvitationReturn = z.strictObject({
	id: z.string().uuid(),
	chanId: z.string().uuid().nullable(),
	chanTitle: zChanTitle.nullable(),
	status: zChanInvitationStatus,
	invitedUserName: zUserName,
    invitedDisplayName: zUserName,
	invitingUserName: zUserName,
    invitingDisplayName: zUserName
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

type FriendInvitationEvent =
	| {
			type: "CREATED_FRIEND_INVITATION"
			data: z.infer<typeof zFriendInvitationReturn>
	  }
	| {
			type: "UPDATED_FRIEND_INVITATION_STATUS"
			data: { friendInvitationId: string; status: z.infer<typeof zFriendInvitationStatus> }
	  }

type ChanInvitationEvent =
	| {
			type: "CREATED_CHAN_INVITATION"
			data: z.infer<typeof zChanInvitationReturn>
	  }
	| {
			type: "UPDATED_CHAN_INVITATION_STATUS"
			data: { chanInvitationId: string; status: z.infer<typeof zChanInvitationStatus> }
	  }

export type InvitationEvent = FriendInvitationEvent | ChanInvitationEvent
