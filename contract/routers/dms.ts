import { DirectMessageStatus } from "@prisma/client";
import { initContract } from "@ts-rest/core";
import { zDmId } from "contract/zod/dm.zod";
import { zDiscussionElementReturn, zMessageId } from "contract/zod/global.zod";
import { zUserName } from "contract/zod/user.zod";
import { z } from "zod";

const c = initContract()

const subpath = '/api/dms'


const zDmReturn = z.object
({
	id: zDmId,
	friendShipId: zDmId.nullable(),
	requestingUserName: zUserName,
	requestedUserName: zUserName,
	requestingUserStatus: z.nativeEnum(DirectMessageStatus),
	requestingUserStatusMutedUntil: z.date().nullable(),
	requestedUserStatus: z.nativeEnum(DirectMessageStatus),
	requestedUserStatusMutedUntil: z.date().nullable()
})

export const dmsContract = c.router
({
	getDms:
	{
		method: 'GET',
		path: `${subpath}/`,
		responses:
		{
			200: z.object
			({
				enabled: z.array(zDmReturn),
				disabled: z.array(zDmReturn)
			})
		}
	},
	createDm:
	{
		method: 'POST',
		path: `${subpath}/`,
		body: z.strictObject
		({
			username: zUserName
		}),
		responses:
		{
			201: zDmReturn
		}
	},
	getDmMessages:
	{
		method: 'GET',
		path: `${subpath}/:dmId/messages`,
		pathParams: z.strictObject
		({
			dmId: zDmId
		}),
		query: z.strictObject
		({
			nMessages: z.coerce.number().positive().int().max(50).default(25),
			cursor: zMessageId.optional()
		}),
		responses:
		{
			200: z.array(zDiscussionElementReturn)
		}
	},
	createDmMessage:
	{
		method: 'POST',
		path: `${subpath}/:dmId/messages`,
		pathParams: z.strictObject
		({
			dmId: zDmId
		}),
		body: z.strictObject
		({
			content: z.string().nonempty(),
			relatedTo: zDmId.optional()
		}),
		responses:
		{
			201: zDiscussionElementReturn
		}
	},
	deleteDmMessage:
	{
		method: 'DELETE',
		path: `${subpath}/:dmId/messages/:messageId`,
		pathParams: z.strictObject
		({
			dmId: zDmId,
			messageId: zMessageId
		}),
		body: c.body<null>(),
		responses:
		{
			202: c.response<null>()
		}
	}
})
