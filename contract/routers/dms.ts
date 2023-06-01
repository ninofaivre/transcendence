import { DirectMessageStatus, ClassicDmEventType } from "@prisma/client";
import { initContract } from "@ts-rest/core";
// import { zDiscussionElementReturn, zMessageId } from "contract/zod/global.zod";
import { zUserName } from "contract/zod/user.zod";
import { z } from "zod";

const c = initContract()

const zDmReturn = z.strictObject
({
	id: z.string().uuid(),
	friendShipId: z.string().uuid().nullable(),
	requestingUserName: zUserName,
	requestedUserName: zUserName,
	requestingUserStatus: z.nativeEnum(DirectMessageStatus),
	requestingUserStatusMutedUntil: z.date().nullable(),
	requestedUserStatus: z.nativeEnum(DirectMessageStatus),
	requestedUserStatusMutedUntil: z.date().nullable(),
	creationDate: z.date()
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
	// getDms:
	// {
	// 	method: 'GET',
	// 	path: '/',
	// 	responses:
	// 	{
	// 		200: z.object
	// 		({
	// 			enabled: z.array(zDmReturn),
	// 			disabled: z.array(zDmReturn)
	// 		})
	// 	}
	// },
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
	// getDmMessages:
	// {
	// 	method: 'GET',
	// 	path: '/:dmId/messages',
	// 	pathParams: z.strictObject
	// 	({
	// 		dmId: zDmId
	// 	}),
	// 	query: z.strictObject
	// 	({
	// 		nMessages: z.coerce.number().positive().int().max(50).default(25),
	// 		cursor: zMessageId.optional()
	// 	}),
	// 	responses:
	// 	{
	// 		200: z.array(zDiscussionElementReturn)
	// 	}
	// },
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
	data: z.infer<typeof zDmDiscussionElementReturn>
}
