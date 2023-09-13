import { initContract } from "@ts-rest/core"
import { extendApi } from "@anatine/zod-openapi"

import { unique } from "../zod/global.zod"
import { zUserName } from "../zod/user.zod"
import { z } from "zod"
import { zChanType, zClassicChanEventType, zPermissionList } from "../generated-zod"
import { zUserStatus } from "../zod/user.zod"
import { getErrorsForContract } from "../errors"

export const defaultPermissions: z.infer<typeof zPermissionList>[] = [
	"INVITE",
	"SEND_MESSAGE",
	"UPDATE_MESSAGE",
]

export const adminPermissions: z.infer<typeof zPermissionList>[] = [
	"KICK",
	"BAN",
	"MUTE",
	"DELETE_MESSAGE",
]

const c = initContract()

export const zChanTitle = z.string().nonempty().max(50).regex(/[^@]*/)
export const zChanPassword = z.string().nonempty().min(8).max(150)
export const zRoleName = z.string().nonempty()

// limitation of javascript setTimeout
export const zTimeOut = z.union([
	z.number().positive().int().lt(2147483647 /*, { message: "timeout is 24 days max" }*/),
	z.literal("infinity"),
])

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
	"UPDATE_MESSAGE",
])

export const zPermissionOverList = z.enum([
	...zPermissionList.exclude(zSelfPermissionList.options).options,
	"UNMUTE",
])

export const zChanUser = z.object({
	name: zUserName,
	displayName: zUserName,
	status: zUserStatus,
	roles: z.array(zRoleName),
	myPermissionOver: z.array(zPermissionOverList),
})

// TODO typer title en fonction de PUBLIC | PRIVATE avec un zBaseChan j'imagine
export const zChanReturn = z.object({
	title: zChanTitle.nullable(),
	type: zChanType,
	roles: z.array(zRoleName),
	ownerName: zUserName,
	id: z.string().uuid(),
	users: z.array(zChanUser).min(1),
	passwordProtected: z.boolean(),
	selfPerms: z.array(zSelfPermissionList),
})

const zChanDiscussionBaseElement = z.strictObject({
	id: z.string().uuid(),
	author: zUserName,
	authorDisplayName: zUserName,
	creationDate: z.date(),
})

const zChanDiscussionBaseMessage = zChanDiscussionBaseElement.extend({
	type: z.literal("message"),
})

const zChanDiscussionBaseEvent = zChanDiscussionBaseElement.extend({
	type: z.literal("event"),
})

export const zChanDiscussionMessageReturnTest = z.union([
	zChanDiscussionBaseMessage.extend({
		content: z.string(),
		isDeleted: z.literal(false),
		isAuthorBlocked: z.boolean(),
		hasBeenEdited: z.boolean(),
		mentionMe: z.boolean(),
	}),
	zChanDiscussionBaseMessage.extend({
		content: z.literal(""),
		isDeleted: z.literal(true),
		isAuthorBlocked: z.boolean(),
		deletingUserName: zUserName,
		deletingDisplayName: zUserName,
	}),
])

export const zChanDiscussionEventReturn = z.union([
	zChanDiscussionBaseEvent.extend({
		concernedUserName: zUserName.nullable(),
		concernedDisplayName: zUserName.nullable(),
		concernMe: z.boolean(),
		eventType: zClassicChanEventType,
	}),
	zChanDiscussionBaseEvent.extend({
		eventType: z.literal("CHANGED_TITLE"),
		oldTitle: z.string(),
		newTitle: z.string(),
	}),
	zChanDiscussionBaseEvent.extend({
		eventType: z.literal("AUTHOR_MUTED_CONCERNED"),
		concernedUserName: zUserName,
		concernedDisplayName: zUserName,
		concernMe: z.boolean(),
		timeoutInMs: zTimeOut,
	}),
])

export const zChanDiscussionMessageReturn = z.union([
	zChanDiscussionBaseMessage.extend({
		content: z.string(),
		relatedTo: z
			.union([zChanDiscussionMessageReturnTest, zChanDiscussionEventReturn])
			.nullable(),
		isDeleted: z.literal(false),
		isAuthorBlocked: z.boolean(),
		hasBeenEdited: z.boolean(),
		mentionMe: z.boolean(),
	}),
	zChanDiscussionBaseMessage.extend({
		content: z.literal(""),
		isDeleted: z.literal(true),
		isAuthorBlocked: z.boolean(),
		deletingUserName: zUserName,
		deletingDisplayName: zUserName,
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
				titleContains: z.string().nonempty(),
				nResult: z.number().positive().int().max(30).default(10),
			}),
			responses: {
				200: z.array(
					z.object({
						passwordProtected: z.boolean(),
						nUsers: z.number().positive().int(),
						id: z.string().uuid(),
						title: zChanTitle,
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
		joinChan: {
			method: "POST",
			path: "/@me",
			body: z.strictObject({
				title: zChanTitle,
				password: zChanPassword.optional(),
			}),
			responses: {
				200: zChanReturn,
				...getErrorsForContract(
					c,
					[400, "ChanDoesntNeedPassword", "ChanNeedPassword"],
					[404, "NotFoundChan"],
					[403, "UserBannedFromChan", "ChanWrongPassword"],
					[409, "ChanUserAlreadyExist"],
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
				...getErrorsForContract(c, [409, "ChanAlreadyExist"]),
			},
		},
		updateChan: {
			method: "PUT",
			path: "/:chanId/infos",
			pathParams: z.strictObject({
				chanId: z.string().uuid(),
			}),
			body: z.discriminatedUnion("type", [
				zCreatePublicChan.extend({
					title: zChanTitle.optional(),
					password: zChanPassword.nullable().optional(),
				}),
				zCreatePrivateChan.extend({
					title: zChanTitle.nullable().optional(),
				}),
			]),
			responses: {
				204: c.type<null>(),
				...getErrorsForContract(
					c,
					[403, "ChanPermissionTooLow"],
					[404, "NotFoundChan"],
					[409, "ChanAlreadyExist"],
				),
			},
		},
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
				...getErrorsForContract(
					c,
					[403, "ChanPermissionTooLow"],
					[404, "NotFoundChan", "NotFoundChanEntity"],
				),
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
				...getErrorsForContract(c, [404, "NotFoundChan", "NotFoundChanEntity"]),
			},
		},
		// BH //
		setUserAdminState: {
			method: "PUT",
			path: "/:chanId/admins/:username",
			pathParams: z.strictObject({
				chanId: z.string().uuid(),
				username: zUserName,
			}),
			body: z.strictObject({
				state: z.boolean().describe("true ==> admin, false ==> non-admin"),
			}),
			responses: {
				204: c.type<null>(),
				...getErrorsForContract(
					c,
					[404, "NotFoundChan", "NotFoundChanEntity"],
					[403, "ChanPermissionTooLow"],
				),
			},
		},
		// BH //
		updateChanMessage: {
			method: "PATCH",
			path: "/:chanId/elements/:elementId",
			pathParams: z.strictObject({
				chanId: z.string().uuid(),
				elementId: z.string().uuid(),
			}),
			body: z.strictObject({
				content: z.string().nonempty(),
			}),
			responses: {
				200: zChanDiscussionMessageReturn,
				...getErrorsForContract(
					c,
					[403, "ChanPermissionTooLow", "NotOwnedChanMessage"],
					[404, "NotFoundChan", "NotFoundChanEntity"],
				),
			},
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
				200: zChanDiscussionMessageReturn,
				...getErrorsForContract(
					c,
					[403, "ChanPermissionTooLowOverUser"],
					[404, "NotFoundChan", "NotFoundChanEntity"],
				),
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
				204: c.type<null>(),
				...getErrorsForContract(
					c,
					[403, "ChanPermissionTooLowOverUser"],
					[404, "NotFoundChan", "NotFoundChanEntity"],
				),
			},
		},
		muteUserFromChan: {
			method: "PUT",
			path: "/:chanId/mutedUsers/:username",
			pathParams: z.strictObject({
				chanId: z.string().uuid(),
				username: zUserName,
			}),
			body: z.strictObject({
				timeoutInMs: zTimeOut,
			}),
			responses: {
				204: c.type<null>(),
				...getErrorsForContract(
					c,
					[403, "ChanPermissionTooLowOverUser"],
					[404, "NotFoundChan", "NotFoundChanEntity"],
				),
			},
		},
		unmuteUserFromChan: {
			method: "DELETE",
			path: "/:chanId/mutedUsers/:username",
			pathParams: z.strictObject({
				chanId: z.string().uuid(),
				username: zUserName,
			}),
			body: c.type<null>(),
			responses: {
				204: c.type<null>(),
				...getErrorsForContract(
					c,
					[403, "ChanPermissionTooLowOverUser"],
					[404, "NotFoundChan", "NotFoundChanEntity"],
				),
			},
		},
		banUserFromChan: {
			method: "PUT",
			path: "/:chanId/bannedUsers/:username",
			pathParams: z.strictObject({
				chanId: z.string().uuid(),
				username: zUserName,
			}),
			body: z.strictObject({
				timeoutInMs: zTimeOut,
			}),
			responses: {
				204: c.type<null>(),
				...getErrorsForContract(
					c,
					[403, "ChanPermissionTooLowOverUser"],
					[404, "NotFoundChan", "NotFoundChanEntity"],
				),
			},
		},
		unbanUserFromChan: {
			method: "DELETE",
			path: "/:chanId/bannedUsers/:username",
			pathParams: z.strictObject({
				chanId: z.string().uuid(),
				username: zUserName,
			}),
			body: c.type<null>(),
			responses: {
				204: c.type<null>(),
				...getErrorsForContract(
					c,
					[403, "ChanPermissionTooLowOverUser"],
					[404, "NotFoundChan", "NotFoundChanEntity"],
				),
			},
		},
	},
	{
		pathPrefix: "/chans",
	},
)

const zUpdatedChan = zChanReturn.pick({
	title: true,
	type: true,
	passwordProtected: true,
	id: true,
})
const zUpdatedChanUser = zChanUser
	.pick({ displayName: true, roles: true, myPermissionOver: true })
	.partial()

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
				chanId: string
				user: z.infer<typeof zChanUser>
			}
	  }
	| {
			type: "UPDATED_CHAN_USER"
			data: {
				chanId: string
				user: z.infer<typeof zUpdatedChanUser> & { name: string }
			}
	  }
	| {
			// on BANNED_CHAN_USER add remove chanUser from array and add name to
			// banUsers array if perm 'BAN' over him. On UNBANNED_CHAN_USER just
			// remove user from bannedUsers array if he was in.
			type: "DELETED_CHAN_USER" | "BANNED_CHAN_USER" // | "UNBANNED_CHAN_USER" not used right now
			data: {
				chanId: string
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
			type: "DELETED_CHAN" | "KICKED_FROM_CHAN" | "BANNED_FROM_CHAN"
			data: { chanId: string }
	  }
