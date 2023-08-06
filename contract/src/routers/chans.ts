import { initContract } from "@ts-rest/core"
import { extendApi } from "@anatine/zod-openapi"

import { unique } from "../zod/global.zod"
import { zUserName } from "../zod/user.zod"
import { z } from "zod"
import {
	zChanType,
	zClassicChanEventType,
	zPermissionList,
} from "../generated-zod"
import { zUserStatus } from "../zod/user.zod"
import { getErrorsForContract } from "../errors"

const c = initContract()

export const zChanTitle = z
	.string()
	.nonempty()
	.max(50)
	.refine((title) => title !== "@me", { message: "forbidden title" })
export const zChanPassword = z.string().nonempty().min(8).max(150)
export const zRoleName = z.string().nonempty()

export const zCreatePublicChan = z.strictObject({
	type: z.literal(zChanType.enum.PUBLIC),
	title: zChanTitle,
	password: zChanPassword.optional(),
})

export const zCreatePrivateChan = z.strictObject({
	type: z.literal(zChanType.enum.PRIVATE),
	title: zChanTitle.optional(),
})

// const zRoleReturn = z.object({
// 	users: z.array(zUserName),
// 	roles: z.array(zRoleName),
// 	permissions: z.array(zPermissionList),
// 	roleApplyOn: zRoleApplyingType,
// 	name: z.string(),
// })

export const zSelfPermissionList = zPermissionList.extract([
	"EDIT",
	"DESTROY",
	"INVITE",
	"SEND_MESSAGE",
    "UPDATE_MESSAGE"
])

// TODO use this in the backend instead of the craps it currently use
export const zPermissionOverList = zPermissionList.exclude(zSelfPermissionList.options)

const zChanUser = z.object({
	name: zUserName,
	status: zUserStatus,
    roles: z.array(zRoleName),
    myPermissionOver: z.array(zPermissionOverList),
})

// TODO typer title en fonction de PUBLIC | PRIVATE avec un zBaseChan j'imagine
const zChanReturn = z.object({
	title: zChanTitle.nullable(),
	type: zChanType,
	ownerName: zUserName,
	id: z.string().uuid(),
	users: z.array(zChanUser).min(1),
	selfPerms: z.array(zSelfPermissionList),
})

const zChanDiscussionBaseElement = z.strictObject({
	id: z.string().uuid(),
	author: zUserName,
	creationDate: z.date(),
})

const zChanDiscussionBaseMessage = zChanDiscussionBaseElement.extend({
	type: z.literal("message"),
})

const zChanDiscussionBaseEvent = zChanDiscussionBaseElement.extend({
	type: z.literal("event"),
})

export const zChanDiscussionMessageReturn = z.union([
	zChanDiscussionBaseMessage.extend({
		content: z.string(),
		relatedTo: z
			.object({
				id: z.string().uuid(),
				preview: z.union([
					z.object({
						type: z.literal("message"),
						isDeleted: z.literal(true),
					}),
					z.object({
						type: z.literal("message"),
						isDeleted: z.literal(false),
						content: z.string(),
					}),
					z.object({
						type: z.literal("event"),
						eventType: z.union([zClassicChanEventType, z.literal("CHANGED_TITLE")]),
					}),
				]),
			})
			.nullable(),
		isDeleted: z.literal(false),
		hasBeenEdited: z.boolean(),
        mentionMe: z.boolean(),
	}),
	zChanDiscussionBaseMessage.extend({
		content: z.literal(""),
		isDeleted: z.literal(true),
		deletingUserName: zUserName,
	}),
])

export const zChanDiscussionEventReturn = z.union([
	zChanDiscussionBaseEvent.extend({
		concernedUserName: zUserName.nullable(),
		concernMe: z.boolean(),
		eventType: zClassicChanEventType,
	}),
	zChanDiscussionBaseEvent.extend({
		eventType: z.literal("CHANGED_TITLE"),
		oldTitle: z.string(),
		newTitle: z.string(),
	}),
])

export const zChanDiscussionElementReturn = z.union([
	zChanDiscussionMessageReturn,
	zChanDiscussionEventReturn,
])

export const chansContract = c.router(
	{
		searchChans: {
			method: "GET",
			path: "/",
			summary: "search for a chan",
			description: "only chan with type PUBLIC are searchable",
			query: z.strictObject({
				titleContains: zChanTitle,
				nResult: z.number().positive().int().max(30).default(10),
			}),
			responses: {
				200: z.array(
					z.object({
						passwordProtected: z.boolean(),
						nUsers: z.number().positive().int(),
						id: z.string().uuid(),
						title: zChanTitle,
						bannedMe: z.boolean(),
					}),
				),
			},
		},
		getMyChans: {
			method: "GET",
			path: "/@me",
			responses: {
				200: z.array(zChanReturn),
			},
		},
		leaveChan: {
			method: "DELETE",
			path: "/@me/:chanId",
			summary: "leave a chan",
			pathParams: z.strictObject({
				chanId: z.string().uuid(),
			}),
			body: c.type<null>(),
			responses: {
				204: c.type<null>(),
				...getErrorsForContract(c, [403, "OwnerCannotLeaveChan"], [404, "NotFoundChan"]),
			},
		},
		joinChanById: {
			method: "POST",
			path: "/@me",
			body: z.strictObject({
				chanId: z.string().uuid(),
				password: zChanPassword.optional(),
			}),
			responses: {
				200: zChanReturn,
				...getErrorsForContract(
					c,
					[400, "ChanDoesntNeedPassword", "ChanNeedPassword"],
					[404, "NotFoundChan", "NotFoundUserForValidToken"],
					[409, "ChanUserAlreadyExist"],
					[500, "EntityModifiedBetweenCreationAndRead"],
				),
			},
		},
		createChan: {
			method: "POST",
			path: "/",
			summary: "create a chan",
			body: z.discriminatedUnion("type", [
				extendApi(zCreatePublicChan, {
					title: "PUBLIC",
				}),
				extendApi(zCreatePrivateChan, {
					title: "PRIVATE",
				}),
			]),
			responses: {
				201: zChanReturn,
				...getErrorsForContract(c,
                    [409, "ChanAlreadyExist"],
                    [500, "EntityModifiedBetweenCreationAndRead"]),
			},
		},
		// updateChan:
		// {
		// 	method: 'PATCH',
		// 	path: '/:chanId',
		// 	pathParams: z.strictObject
		// 	({
		// 		chanId: zChanId
		// 	}),
		// 	body: z.discriminatedUnion("type",
		// 	[
		// 		z.strictObject
		// 		({
		// 			type: z.literal(ChanType.PUBLIC),
		// 			title: zChanTitle.optional(),
		// 			password: zChanPassword.nullable().optional()
		// 		}),
		// 		z.strictObject
		// 		({
		// 			type: z.literal(ChanType.PRIVATE),
		// 			title: zChanTitle.nullable().optional()
		// 		}),
		// 		z.strictObject
		// 		({
		// 			type: z.undefined(),
		// 			title: zChanTitle.nullable().optional(),
		// 			password: zChanPassword.nullable().optional()
		// 		})
		// 	]),
		// 	responses:
		// 	{
		// 		204: zChanReturn
		// 	}
		// },
		deleteChan: {
			method: "DELETE",
			path: "/:chanId",
			summary: "delete a chan",
			pathParams: z.strictObject({
				chanId: z.string().uuid(),
			}),
			body: c.type<null>(),
			responses: {
				204: c.type<null>(),
				...getErrorsForContract(c, [403, "ChanPermissionTooLow"], [404, "NotFoundChan"]),
			},
		},
		createChanMessage: {
			method: "POST",
			path: "/:chanId/elements",
			summary: "post a message to a chan",
			pathParams: z.strictObject({
				chanId: z.string().uuid(),
			}),
			body: z.strictObject({
				content: z.string().nonempty().max(5000),
				relatedTo: z.string().uuid().optional().describe("id of the related msg/event"),
			}),
			responses: {
				201: zChanDiscussionMessageReturn,
                ...getErrorsForContract(c,
                    [403, "ChanPermissionTooLow"],
                    [404, "NotFoundChan", "NotFoundChanEntity"])
			},
		},
		getChanElements: {
			method: "GET",
			path: "/:chanId/elements",
			summary: "get elements by cursor in chan",
			pathParams: z.strictObject({
				chanId: z.string().uuid(),
			}),
			query: z.strictObject({
				nElements: z.number().positive().int().max(50).default(25),
				cursor: z.string().uuid().optional(),
			}),
			responses: {
				200: z.array(zChanDiscussionElementReturn),
                ...getErrorsForContract(c,
                    [404, "NotFoundChan", "NotFoundChanEntity"])
			},
		},
		// getChanElementById: {
		// 	method: "GET",
		// 	path: "/:chanId/elements/:elementId",
		// 	pathParams: z.strictObject({
		// 		chanId: z.string().uuid(),
		// 		elementId: z.string().uuid(),
		// 	}),
		// 	responses: {
		// 		200: zChanDiscussionElementReturn,
		// 	},
		// },
        updateChanMessage: {
            method: "PATCH",
            path: "/:chanId/elements/:elementId",
            pathParams: z.strictObject({
                chanId: z.string().uuid(),
                elementId: z.string().uuid(),
            }),
            body: z.strictObject({
                content: z.string().nonempty()
            }),
            responses: {
                200: zChanDiscussionMessageReturn,
                ...getErrorsForContract(c,
                    [403, "ChanPermissionTooLow", "NotOwnedChanMessage"],
                    [404, "NotFoundChan", "NotFoundChanEntity"],
                    [500, "EntityModifiedBetweenUpdateAndRead"])
            }
        },
		deleteChanMessage: {
			method: "DELETE",
			path: "/:chanId/elements/:elementId",
			pathParams: z.object({
				chanId: z.string().uuid(),
				elementId: z.string().uuid(),
			}),
			body: c.type<null>(),
			responses: {
				202: zChanDiscussionMessageReturn,
                ...getErrorsForContract(c,
                    [403, "ChanPermissionTooLowOverUser"],
                    [404, "NotFoundChan", "NotFoundChanEntity"],
                    [500, "EntityModifiedBetweenUpdateAndRead"])
			},
		},
		kickUserFromChan: {
			method: "DELETE",
			path: "/:chanId/:username",
			pathParams: z.strictObject({
				chanId: z.string().uuid(),
				username: zUserName,
			}),
			body: c.type<null>(),
			responses: {
				202: c.type<null>(),
                ...getErrorsForContract(c,
                    [403, "ChanPermissionTooLowOverUser"],
                    [404, "NotFoundChan", "NotFoundChanEntity"])
			},
		}
	},
	{
		pathPrefix: "/chans",
	},
)

const zUpdatedChan = zChanReturn.pick({ title: true, type: true, ownerName: true, id: true })
const zUpdatedChanUser = zChanUser.pick({ name: true, roles: true, myPermissionOver: true })

export type ChanEvent =
	| {
			type: "CREATED_CHAN"
			data: z.infer<typeof zChanReturn>
	  }
	| {
			type: "UPDATED_CHAN_INFO"
			data: z.infer<typeof zUpdatedChan>
	  }
	| {
			type: "CREATED_CHAN_USER"
			data: {
                chanId: string,
                user: z.infer<typeof zChanUser>
            }
	  }
    | {
            type: "UPDATED_CHAN_USER"
            data: {
                chanId: string,
                user: z.infer<typeof zUpdatedChanUser>
            }
      }
	| {
			type: "DELETED_CHAN_USER"
			data: {
                chanId: string,
                username: z.infer<typeof zUserName>
            }
	  }
	| {
			type: "UPDATED_CHAN_SELF_PERMS"
			data: {
				chanId: string
				selfPerms: z.infer<typeof zSelfPermissionList>[]
			}
	  }
	| {
			type: "CREATED_CHAN_ELEMENT"
			data: { chanId: string; element: z.infer<typeof zChanDiscussionElementReturn> }
	  }
	| {
			type: "UPDATED_CHAN_MESSAGE"
			data: { chanId: string; message: z.infer<typeof zChanDiscussionMessageReturn> }
	  }
	| {
			type: "DELETED_CHAN" | "KICKED_FROM_CHAN"
			data: { chanId: string }
	  }
