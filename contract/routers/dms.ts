import { DirectMessageStatus, ClassicDmEventType, DirectMessageUserStatus } from "@prisma/client";
import { initContract } from "@ts-rest/core";
import { zUserName } from "contract/zod/user.zod";
import { z } from "zod";

const c = initContract()

const zDmReturn = z.strictObject
({
	id: z.string().uuid(),
	friendShipId: z.string().uuid().nullable(),
	requestingUserName: zUserName,
	requestedUserName: zUserName,
	requestingUserStatus: z.nativeEnum(DirectMessageUserStatus),
	requestingUserStatusMutedUntil: z.date().nullable(),
	requestedUserStatus: z.nativeEnum(DirectMessageUserStatus),
	requestedUserStatusMutedUntil: z.date().nullable(),
	creationDate: z.date(),
	status: z.nativeEnum(DirectMessageStatus)
})

const zDmDiscussionMessageReturn = z.strictObject
({
	content: z.string(),
	relatedTo: z.string().uuid().nullable()
})

// unused right now but probably usefull in the future
const zDmDiscussionBaseEvent = z.strictObject({})

export const zDmDiscussionEventReturn = z.union
([
	zDmDiscussionBaseEvent.extend
	({
		eventType: z.nativeEnum(ClassicDmEventType),
	}),
	zDmDiscussionBaseEvent.extend
	({
		eventType: z.literal("CHAN_INVITATION"),
		chanInvitationId: z.string().uuid()
	})
])

const zDmDiscussionBaseElement = z.strictObject
({
	id: z.string().uuid(),
	author: zUserName,
	creationDate: z.date(),
})

export const zDmDiscussionElementReturn = z.discriminatedUnion("type",
[
	zDmDiscussionBaseElement.extend
	({
		type: z.literal('message'),
		message: zDmDiscussionMessageReturn
	}),
	zDmDiscussionBaseElement.extend
	({
		type: z.literal('event'),
		event: zDmDiscussionEventReturn
	})
])

export const dmsContract = c.router
({
	getDms:
	{
		method: 'GET',
		path: '/',
		responses:
		{
			200: z.strictObject
			({
				enabled: z.array(zDmReturn),
				disabled: z.array(zDmReturn)
			})
		}
	},
	// stay commented because rn we can only have dm with friends (autocreated dms)
	// createDm:
	// {
	// 	method: 'POST',
	// 	path: '/',
	// 	body: z.strictObject
	// 	({
	// 		username: zUserName
	// 	}),
	// 	responses:
	// 	{
	// 		201: zDmReturn
	// 	}
	// },
	getDmMessages:
	{
		method: 'GET',
		path: '/:dmId/messages',
		pathParams: z.strictObject
		({
			dmId: z.string().uuid()
		}),
		query: z.strictObject
		({
			nMessages: z.number().positive().int().max(50).default(25),
			cursor: z.string().uuid().optional()
		}),
		responses:
		{
			200: z.array(zDmDiscussionElementReturn)
		}
	},
	// createDmMessage:
	// {
	// 	method: 'POST',
	// 	path: '/:dmId/messages',
	// 	pathParams: z.strictObject
	// 	({
	// 		dmId: zDmId
	// 	}),
	// 	body: z.strictObject
	// 	({
	// 		content: z.string().nonempty(),
	// 		relatedTo: zDmId.optional()
	// 	}),
	// 	responses:
	// 	{
	// 		201: zDiscussionElementReturn
	// 	}
	// },
	// deleteDmMessage:
	// {
	// 	method: 'DELETE',
	// 	path: '/:dmId/messages/:messageId',
	// 	pathParams: z.strictObject
	// 	({
	// 		dmId: zDmId,
	// 		messageId: zMessageId
	// 	}),
	// 	body: c.body<null>(),
	// 	responses:
	// 	{
	// 		202: c.response<null>()
	// 	}
	// }
})

export type DmEvent =
{ type: 'CREATED_DM', data: z.infer<typeof zDmReturn> } |
{
	type: 'CREATED_DM_EVENT' | 'CREATED_DM_MESSAGE',
	data: { dmId: string, element: z.infer<typeof zDmDiscussionElementReturn> }
}
