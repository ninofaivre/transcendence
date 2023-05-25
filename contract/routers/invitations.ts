import { initContract } from "@ts-rest/core";
import { zInvitationFilter } from "contract/zod/inv.zod";
import { zUserName } from "contract/zod/user.zod";
import { z } from "zod";
import { unique } from "contract/zod/global.zod";
import { ChanInvitationStatus, FriendInvitationStatus } from "@prisma/client";
import { prefix } from "contract/lib/prefix";
import { DmEvent } from "./dms";

const c = initContract()

const zFriendInvitationReturn = z.strictObject
({
	id: z.string().uuid(),
	creationDate: z.date(),
	invitingUserName: zUserName,
	invitedUserName: zUserName,
	status: z.nativeEnum(FriendInvitationStatus)
})

const zChanInvitationReturn = z.strictObject
({
	id: z.string().uuid(),
	chanId: z.string().uuid(),
	friendShipId: z.string().uuid(),
	status: z.nativeEnum(ChanInvitationStatus)
})

const friendInvitationsContract = c.router
({		
	getFriendInvitations:
	{
		method: 'GET',
		path: '/',
		query: z.strictObject
		({
			status: unique(z.array(z.nativeEnum(FriendInvitationStatus))).default(["PENDING"]),
		}),
		responses:
		{
			200: z.strictObject
			({
				incoming: z.array(zFriendInvitationReturn),
				outcoming: z.array(zFriendInvitationReturn)
			})
		}
	},
	getFriendInvitationById:
	{
		method: 'GET',
		path: '/:id',
		pathParams: z.strictObject
		({
			id: z.string().uuid()
		}),
		responses:
		{
			200: zFriendInvitationReturn
		}
	},
	getFriendInvitationsByType:
	{
		method: 'GET',
		path: '/:type',
		query: z.strictObject
		({
			status: unique(z.array(z.nativeEnum(FriendInvitationStatus))).default(["PENDING"]),
		}),
		pathParams: z.strictObject
		({
			type: zInvitationFilter
		}),
		responses:
		{
			200: z.array(zFriendInvitationReturn)
		}
	},
	createFriendInvitation:
	{
		method: 'POST',
		path: `/${zInvitationFilter.enum.OUTCOMING}`,
		body: z.strictObject
		({
			invitedUserName: zUserName
		}),
		responses:
		{
			201: zFriendInvitationReturn
		}
	},
	updateIncomingFriendInvitation:
	{
		method: 'PATCH',
		path: `/${zInvitationFilter.enum.INCOMING}/:id`,
		pathParams: z.strictObject
		({
			id: z.string().uuid()
		}),
		body: z.strictObject
		({
			status: z.enum([FriendInvitationStatus.ACCEPTED, FriendInvitationStatus.REFUSED])
		}),
		responses:
		{
			200: zFriendInvitationReturn
		}
	},
	updateOutcomingFriendInvitation:
	{
		method: 'PATCH',
		path: `/${zInvitationFilter.enum.OUTCOMING}/:id`,
		pathParams: z.strictObject
		({
			id: z.string().uuid()
		}),
		body: z.strictObject
		({
			status: z.enum([FriendInvitationStatus.CANCELED])
		}),
		responses:
		{
			200: zFriendInvitationReturn
		}
	}
	// deletePendingFriendInvitationById:
	// {
	// 	method: 'DELETE',
	// 	path: `/friend/${FriendInvitationStatus.PENDING}/:type/:id`,
	// 	pathParams: z.strictObject
	// 	({
	// 		id: zFriendInvitationId,
	// 		type: zInvitationFilter
	// 	}),
	// 	body: c.body<null>(),
	// 	responses:
	// 	{
	// 		202: c.response<null>()
	// 	}
	// },

})

const chanInvitationsContract = c.router
({
	// getPendingChanInvitations:
	// {
	// 	method: 'GET',
	// 	path: `/chan/${ChanInvitationStatus.PENDING}`,
	// 	responses:
	// 	{
	// 		200: z.object
	// 		({
	// 			incoming: z.array(zChanInvitationReturn),
	// 			outcoming: z.array(zChanInvitationReturn)
	// 		})
	// 	}
	// },
	// getPendingChanInvitationsByType:
	// {
	// 	method: 'GET',
	// 	path: `/chan/${ChanInvitationStatus.PENDING}/:type`,
	// 	pathParams: z.strictObject
	// 	({
	// 		type: zInvitationFilter
	// 	}),
	// 	responses:
	// 	{
	// 		200: z.array(zChanInvitationReturn)
	// 	}
	// },
	// createChanInvitation:
	// {
	// 	method: 'POST',
	// 	path: `/chan/${ChanInvitationStatus.PENDING}/${zInvitationFilter.enum.OUTCOMING}`,
	// 	body: z.strictObject
	// 	({
	// 		usernames: unique(z.array(zUserName)),
	// 		chanId: zChanId
	// 	}),
	// 	responses:
	// 	{
	// 		201: z.array(zChanInvitationReturn)
	// 	}
	// },
	// deletePendingChanInvitationById:
	// {
	// 	method: 'DELETE',
	// 	path: `/chan/${ChanInvitationStatus.PENDING}/:type/:id`,
	// 	pathParams: z.strictObject
	// 	({
	// 		type: zInvitationFilter,
	// 		id: zChanId
	// 	}),
	// 	body: c.body<null>(),
	// 	responses:
	// 	{
	// 		202: c.response<null>()
	// 	}
	// }

})

export const invitationsContract = c.router
({
	friend: prefix(friendInvitationsContract, "friend"),
	chan: prefix(chanInvitationsContract, "chan")
})

type FriendInvitationEvent =
{ type: 'CREATED_FRIEND_INVITATION' | 'UPDATED_FRIEND_INVITATION', data: z.infer<typeof zFriendInvitationReturn> }

type ChanInvitationEvent =
{}

export type InvitationEvent = FriendInvitationEvent/*  | ChanInvitationEvent */
