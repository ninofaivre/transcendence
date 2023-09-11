import { initContract } from "@ts-rest/core"
import { zUserName } from "../zod/user.zod"
import { z } from "zod"
import { zClassicDmEventType, zDirectMessageStatus } from "../generated-zod"
import { zChanTitle } from "./chans"
import { zUserStatus } from "../zod/user.zod"
import { getErrorsForContract } from "../errors"
import { zChanInvitationStatus } from "../generated-zod"

const c = initContract()

export const zDmReturn = z.strictObject({
	id: z.string().uuid(),
	otherName: zUserName,
    otherDisplayName: zUserName,
	otherStatus: zUserStatus,
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
    authorDisplayName: zUserName
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
        otherDisplayName: zUserName
	}),
	zDmDiscussionBaseEvent.extend({
		eventType: z.literal("BLOCKED"),
		blockedUserName: zUserName,
        blockedDisplayName: zUserName,
		blockingUserName: zUserName,
        blockingDisplayName: zUserName
	}),
	zDmDiscussionBaseEvent.extend({
        id: z.string().uuid(),
        status: zChanInvitationStatus,
		eventType: z.literal("CHAN_INVITATION"),
		author: zUserName,
        authorDisplayName: zUserName,
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
        // sniff sniff
		// createDm: {
		// 	method: "POST",
		// 	path: "/",
		// 	body: z.strictObject({
		// 		username: zUserName,
		// 	}),
		// 	responses: {
		// 		201: zDmReturn,
		// 		...getErrorsForContract(
		// 			c,
		// 			[403, "BlockedUser", "BlockedByUser", "ProximityLevelTooLow"],
		// 			[404, "NotFoundUser"],
		// 			[409, "DmAlreadyExist"],
		// 		),
		// 	},
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
		updateDmMessage: {
			method: "PATCH",
			path: "/:dmId/elements/:elementId",
			pathParams: z.object({
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
			path: "/:dmId/messages/:elementId",
			pathParams: z.object({
				dmId: z.string().uuid(),
				elementId: z.string().uuid(),
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
			type: "CREATED_DM_ELEMENT"
			data: { dmId: string; element: z.infer<typeof zDmDiscussionElementReturn> }
	  }
	| {
			type: "UPDATED_DM_MESSAGE"
			data: { dmId: string; message: z.infer<typeof zDmDiscussionMessageReturn> }
	  }
