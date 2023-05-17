import { initContract } from "@ts-rest/core";
import { zChanInvitationId, zFriendInvitationId, zInvitationFilter } from "contract/zod/inv.zod";
import { zUserName } from "contract/zod/user.zod";
import { z } from "zod";
import { unique } from "contract/zod/global.zod";

const c = initContract()

const subpath = '/api/invitations'

const zChanId = z.coerce.number().positive().int()
const zFriendShipId = z.coerce.number().positive().int()

const zFriendInvitationReturn = z.object
({
	id: zFriendInvitationId,
	creationDate: z.date(),
	invitingUserName: zUserName,
	invitedUserName: zUserName
})

const zChanInvitationReturn = z.object
({
	id: zChanInvitationId,
	chanId: zChanId,
	friendShipId: zFriendShipId
})

export const invitationsContract = c.router
({
	getFriendInvitations:
	{
		method: 'GET',
		path: `${subpath}/friend`,
		responses:
		{
			200: z.object
			({
				incoming: z.array(zFriendInvitationReturn),
				outcoming: z.array(zFriendInvitationReturn)
			})
		}
	},
	getFriendInvitationsByType:
	{
		method: 'GET',
		path: `${subpath}/friend/:type`,
		pathParams: z.strictObject
		({
			type: zInvitationFilter
		}) ,
		responses:
		{
			200: z.array(zFriendInvitationReturn)
		}
	},
	createFriendInvitation:
	{
		method: 'POST',
		path: `${subpath}/friend/${zInvitationFilter.enum.OUTCOMING}`,
		body: z.strictObject
		({
			username: zUserName
		}),
		responses:
		{
			201: zFriendInvitationReturn
		}
	},
	deleteFriendInvitation:
	{
		method: 'DELETE',
		path: `${subpath}/friend/:type/:id`,
		pathParams: z.strictObject
		({
			id: zFriendInvitationId,
			type: zInvitationFilter
		}),
		body: c.body<null>(),
		responses:
		{
			202: c.response<null>()
		}
	},
	getChanInvitations:
	{
		method: 'GET',
		path: `${subpath}/chan`,
		responses:
		{
			200: z.object
			({
				incoming: z.array(zChanInvitationReturn),
				outcoming: z.array(zChanInvitationReturn)
			})
		}
	},
	getChanInvitationsByType:
	{
		method: 'GET',
		path: `${subpath}/chan/:type`,
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
		path: `${subpath}/chan/${zInvitationFilter.enum.OUTCOMING}`,
		body: z.strictObject
		({
			usernames: unique(z.array(zUserName)),
			chanId: zChanId
		}),
		responses:
		{
			201: z.array(zChanInvitationReturn)
		}
	},
	deleteChanInvitation:
	{
		method: 'DELETE',
		path: `${subpath}/chan/:type/:id`,
		pathParams: z.strictObject
		({
			type: zInvitationFilter,
			id: zChanId
		}),
		body: c.body<null>(),
		responses:
		{
			202: c.response<null>()
		}
	}
})
