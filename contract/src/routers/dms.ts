import { initContract } from "@ts-rest/core"
import { zUserName } from "../zod/user.zod"
import { z } from "zod"
import { ClassicDmEventType, DirectMessageStatus } from "@prisma-generated/enums"
import { zChanTitle } from "./chans"
import { zUserStatus } from "./users"

const c = initContract()

const zDirectMessageStatus = z.nativeEnum(DirectMessageStatus)
const zClassicDmEventType = z.nativeEnum(ClassicDmEventType)

const test = z.enum(["ENABLED", "DISABLED"])

type t = z.infer<typeof test>
(a: DirectMessageStatus, b: t) => a satisfies t && b satisfies DirectMessageStatus

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

const zDmDiscussionBaseEvent = zDmDiscussionBaseElement
    .extend({
        type: z.literal("event")
    })
const zDmDiscussionMessageReturn = z.strictObject({
    author: zUserName,
	content: z.string(),
	relatedTo: z.string().uuid().nullable(),
    hasBeenEdited: z.boolean()
})

const zDmDiscussionEventReturn = z.discriminatedUnion("eventType", [
    zDmDiscussionBaseEvent.extend({
		eventType: zClassicDmEventType,
        otherName: zUserName // if we really need it
	}),
    zDmDiscussionBaseEvent.extend({
        eventType: z.literal("BLOCKED"),
        blockedUserName: zUserName,
        blockingUserName: zUserName
    }),
    zDmDiscussionBaseEvent.extend({
        eventType: z.literal("DELETED_MESSAGE"),
        author: zUserName
    }),
	zDmDiscussionBaseEvent.extend({
		eventType: z.literal("CHAN_INVITATION"),
        author: zUserName,
        chanTitle: zChanTitle.optional() // peut-être plus tard complexifier avec chan preview
	})

])

export const zDmDiscussionElementReturn = z.union([
	zDmDiscussionBaseElement
        .merge(zDmDiscussionMessageReturn)
        .extend({ type: z.literal("message") }),
    zDmDiscussionEventReturn
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
                nResult: z.number().positive().int().max(15).default(5)
            }),
            responses: {
                200: z.strictObject({
                    otherUserName: zUserName,
                    dmId: z.string().uuid()
                }).array()
            }
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
			body: c.type<null>(),
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
