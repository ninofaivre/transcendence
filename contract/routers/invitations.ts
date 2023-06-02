import { initContract } from "@ts-rest/core";
import { zInvitationFilter } from "contract/zod/inv.zod";
import { zUserName } from "contract/zod/user.zod";
import { z } from "zod";
import { unique } from "contract/zod/global.zod";
import { ChanInvitationStatus, FriendInvitationStatus } from "@prisma/client";
import { prefix } from "contract/lib/prefix";
import { zChanTitle } from "contract/zod/chan.zod";

const c = initContract()

export const zFriendInvitationReturn = z.strictObject
({
	id: z.string().uuid(),
	creationDate: z.date(),
	invitingUserName: zUserName,
	invitedUserName: zUserName,
	status: z.nativeEnum(FriendInvitationStatus)
})

export const zChanInvitationReturn = z.strictObject
({
	id: z.string().uuid(),
	chanId: z.string().uuid().nullable(),
	chanTitle: zChanTitle.nullable(),
	status: z.nativeEnum(ChanInvitationStatus),
	invitedUserName: zUserName,
	invitingUserName: zUserName,
	dmId: z.string().uuid(),
	eventId: z.string().uuid()
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
})

const chanInvitationsContract = c.router
({
	getChanInvitations:
	{
		method: 'GET',
		path: '/',
		query: z.strictObject
		({
			status: unique(z.array(z.nativeEnum(ChanInvitationStatus))).default(["PENDING"]),
		}),
		responses:
		{
			200: z.strictObject
			({
				incoming: z.array(zChanInvitationReturn),
				outcoming: z.array(zChanInvitationReturn)
			})
		}
	},
	getChanInvitationById:
	{
		method: 'GET',
		path: '/:id',
		pathParams: z.strictObject
		({
			id: z.string().uuid()
		}),
		responses:
		{
			200: zChanInvitationReturn
		}
	},
	getChanInvitationsByType:
	{
		method: 'GET',
		path: '/:type',
		query: z.strictObject
		({
			status: unique(z.array(z.nativeEnum(ChanInvitationStatus))).default(["PENDING"]),
		}),
		pathParams: z.strictObject
		({
			type: zInvitationFilter
		}),
		responses:
		{
			200: z.array(zChanInvitationReturn)
		}
	},
	createChanInvitation:
	{
		method: 'POST',
		path: `/${zInvitationFilter.enum.OUTCOMING}`,
		body: z.strictObject
		({
			invitedUserName: zUserName,
			chanId: z.string().uuid()
		}),
		responses:
		{
			201: zChanInvitationReturn
		}
	},
	updateIncomingChanInvitation:
	{
		method: 'PATCH',
		path: `/${zInvitationFilter.enum.INCOMING}/:id`,
		pathParams: z.strictObject
		({
			id: z.string().uuid()
		}),
		body: z.strictObject
		({
			status: z.enum([ChanInvitationStatus.ACCEPTED, ChanInvitationStatus.REFUSED])
		}),
		responses:
		{
			200: zChanInvitationReturn
		}
	},
	updateOutcomingChanInvitation:
	{
		method: 'PATCH',
		path: `/${zInvitationFilter.enum.OUTCOMING}/:id`,
		pathParams: z.strictObject
		({
			id: z.string().uuid()
		}),
		body: z.strictObject
		({
			status: z.enum([ChanInvitationStatus.CANCELED])
		}),
		responses:
		{
			200: zChanInvitationReturn
		}
	}
})

export const invitationsContract = c.router
({
	friend: prefix(friendInvitationsContract, "friend"),
	chan: prefix(chanInvitationsContract, "chan")
})

type FriendInvitationEvent =
{
	type: 'CREATED_FRIEND_INVITATION' | 'UPDATED_FRIEND_INVITATION',
	data: z.infer<typeof zFriendInvitationReturn>
}

type ChanInvitationEvent =
{
	type: 'CREATED_CHAN_INVITATION' | 'UPDATED_CHAN_INVITATION',
	data: z.infer<typeof zChanInvitationReturn>
}

export type InvitationEvent = FriendInvitationEvent | ChanInvitationEvent
