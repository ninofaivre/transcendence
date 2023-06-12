import { initContract } from "@ts-rest/core"
import { zUserName } from "../zod/user.zod"
import { z } from "zod"
import { ClassicDmEventType, DirectMessageStatus, DirectMessageUserStatus } from "prisma-client"

const c = initContract()

const zDirectMessageStatus = z.nativeEnum(DirectMessageStatus)
const zClassicDmEventType = z.nativeEnum(ClassicDmEventType)
const zDirectMessageUserStatus = z.nativeEnum(DirectMessageUserStatus)

export const zDmReturn = z.strictObject({
	id: z.string().uuid(),
	friendName: zUserName, // mb change it later as it is possibly not a friend
	myDmStatus: zDirectMessageUserStatus, // prévu pour plus tard, sera sûrement un peu modiffié d'ici-là
	myDmMutedUntil: z.date().nullable(), // prévu pour plus tard, sera sûrement un peu modiffié d'ici-là
	creationDate: z.date(),
	status: zDirectMessageStatus,
})

const zDmDiscussionMessageReturn = z.strictObject({
	content: z.string(),
	relatedTo: z.string().uuid().nullable(),
})

// unused right now but probably usefull in the future
const zDmDiscussionBaseEvent = z.strictObject({})

export const zDmDiscussionEventReturn = z.union([
	zDmDiscussionBaseEvent.extend({
		eventType: zClassicDmEventType,
	}),
	zDmDiscussionBaseEvent.extend({
		eventType: z.literal("CHAN_INVITATION"),
		chanInvitationId: z.string().uuid(),
	}),
])

const zDmDiscussionBaseElement = z.strictObject({
	id: z.string().uuid(),
	author: zUserName,
	creationDate: z.date(),
})

export const zDmDiscussionElementReturn = z.discriminatedUnion("type", [
	zDmDiscussionBaseElement.extend({
		type: z.literal("message"),
		message: zDmDiscussionMessageReturn,
	}),
	zDmDiscussionBaseElement.extend({
		type: z.literal("event"),
		event: zDmDiscussionEventReturn,
	}),
])

export const dmsContract = c.router(
	{
		getDms: {
			method: "GET",
			path: "/",
			responses: {
				200: z.array(zDmReturn),
			},
		},
		//
		// stay commented because rn we can only have dm with friends (autocreated dms)
		//
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
		getDmElements: {
			method: "GET",
			path: "/:dmId/elements",
			pathParams: z.strictObject({
				dmId: z.string().uuid(),
			}),
			query: z.strictObject({
				nElements: z.number().positive().int().max(50).default(25),
				cursor: z.string().uuid().optional(),
			}),
			responses: {
				200: z.array(zDmDiscussionElementReturn),
			},
		},
		createDmMessage: {
			method: "POST",
			path: "/:dmId/elements",
			pathParams: z.strictObject({
				dmId: z.string().uuid(),
			}),
			body: z.strictObject({
				content: z.string().nonempty(),
				relatedTo: z.string().uuid().optional(),
			}),
			responses: {
				201: zDmDiscussionElementReturn,
			},
		},
		getDmElementById: {
			method: "GET",
			path: "/:dmId/elements/:elementId",
			pathParams: z.strictObject({
				dmId: z.string().uuid(),
				elementId: z.string().uuid(),
			}),
			responses: {
				200: zDmDiscussionElementReturn,
			},
		},
		updateMessage: {
			method: "PATCH",
			path: "/:dmId/elements/:elementId",
			pathParams: z.strictObject({
				dmId: z.string().uuid(),
				elementId: z.string().uuid(),
			}),
			body: z.strictObject({
				content: z.string().nonempty(),
			}),
			responses: {
				200: zDmDiscussionElementReturn,
			},
		},
		deleteDmMessage: {
			method: "DELETE",
			path: "/:dmId/messages/:messageId",
			pathParams: z.strictObject({
				dmId: z.string().uuid(),
				messageId: z.string().uuid(),
			}),
			body: c.body<null>(),
			responses: {
				202: zDmDiscussionElementReturn,
			},
		},
	},
	{
		pathPrefix: "/dms",
	},
)

export type DmEvent =
	| {
			type: "CREATED_DM" | "UPDATED_DM"
			data: z.infer<typeof zDmReturn>
	  }
	| {
			type: "CREATED_DM_ELEMENT" | "UPDATED_DM_ELEMENT"
			data: { dmId: string; element: z.infer<typeof zDmDiscussionElementReturn> }
	  }
