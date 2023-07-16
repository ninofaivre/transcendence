import { initContract } from "@ts-rest/core"
import { zUserName } from "../zod/user.zod"
import { z } from "zod"
import { zClassicDmEventType, ClassicDmEventType, zDirectMessageStatus } from "../generated-zod"
import { zChanTitle } from "./chans"
import { zUserStatus } from "./users"

const c = initContract()

export const zDmReturn = z.strictObject({
	id: z.string().uuid(),
	otherName: zUserName,
	otherStatus: zUserStatus,
	// myDmMutedUntil: z.date().nullable(), // à implémenter si on veux et qu'on a le temps
	creationDate: z.date(),
	status: zDirectMessageStatus,
})

const zDmDiscussionBaseElement = z.strictObject({
	id: z.string().uuid(),
	creationDate: z.date(),
})

const zDmDiscussionBaseEvent = zDmDiscussionBaseElement.extend({
	type: z.literal("event"),
})

const zDmDiscussionBaseMessage = zDmDiscussionBaseElement.extend({
	type: z.literal("message"),
	author: zUserName,
})

export const zDmDiscussionMessageReturn = z.union([
	zDmDiscussionBaseMessage.extend({
		content: z.string().nonempty(),
		hasBeenEdited: z.boolean(),
		isDeleted: z.literal(false),
		relatedTo: z.string().uuid().nullable(),
	}),
	zDmDiscussionBaseMessage.extend({
		content: z.literal(""),
		isDeleted: z.literal(true),
	}),
])

export const zDmDiscussionEventReturn = z.union([
	zDmDiscussionBaseEvent.extend({
		eventType: zClassicDmEventType,
		otherName: zUserName, // if we really need it
	}),
	zDmDiscussionBaseEvent.extend({
		eventType: z.literal("BLOCKED"),
		blockedUserName: zUserName,
		blockingUserName: zUserName,
	}),
	zDmDiscussionBaseEvent.extend({
		eventType: z.literal("CHAN_INVITATION"),
		author: zUserName,
		chanTitle: zChanTitle.optional(), // peut-être plus tard complexifier avec chan preview
	}),
])

export const zDmDiscussionElementReturn = z.union([
	zDmDiscussionMessageReturn,
	zDmDiscussionEventReturn,
])

// TODO: mb find better path to be more REST compliant or fuck REST ???
export const dmsContract = c.router(
	{
		getDms: {
			method: "GET",
			path: "/",
			responses: {
				200: z.array(zDmReturn),
			},
		},
		searchDms: {
			method: "GET",
			path: "/search",
			query: z.strictObject({
				otherUserNameContains: z.string().nonempty(),
				nResult: z.number().positive().int().max(15).default(5),
			}),
			responses: {
				200: z
					.strictObject({
						otherUserName: zUserName,
						dmId: z.string().uuid(),
					})
					.array(),
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
				201: zDmDiscussionMessageReturn,
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
				200: zDmDiscussionMessageReturn,
			},
		},
		deleteDmMessage: {
			method: "DELETE",
			path: "/:dmId/messages/:messageId",
			pathParams: z.strictObject({
				dmId: z.string().uuid(),
				messageId: z.string().uuid(),
			}),
			body: c.type<null>(),
			responses: {
				202: zDmDiscussionMessageReturn,
			},
		},
	},
	{
		pathPrefix: "/dms",
	},
)

export type DmEvent =
	| {
			type: "CREATED_DM"
			data: z.infer<typeof zDmReturn>
	  }
	| {
			type: "UPDATED_DM_STATUS"
			data: { dmId: string; status: z.infer<typeof zDirectMessageStatus> }
	  }
	| {
			type: "UPDATED_DM_STATUS"
			data: { dmId: string; status: z.infer<typeof zDirectMessageStatus> }
	  }
	| {
			type: "CREATED_DM_ELEMENT"
			data: { dmId: string; element: z.infer<typeof zDmDiscussionElementReturn> }
	  }
	| {
			type: "DELETED_DM_MESSAGE"
			data: { dmId: string; messageId: string }
	  }
	| {
			type: "UPDATED_DM_MESSAGE"
			data: { dmId: string; message: z.infer<typeof zDmDiscussionMessageReturn> }
	  }
