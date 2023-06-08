import { extendApi } from "@anatine/zod-openapi"
import { ClassicChanEventType, ChanType, PermissionList, RoleApplyingType } from "@prisma/client"
import { initContract } from "@ts-rest/core"
import { unique } from "contract/zod/global.zod"
import { zUserName } from "contract/zod/user.zod"
import { z } from "zod"

const c = initContract()

export const zChanTitle = z.string().nonempty().max(50).refine(title => title !== "@me", { message: "invalid title" })
export const zChanPassword = z.string().nonempty().min(8).max(150)
export const zRoleName = z.string().nonempty()

export const zCreatePublicChan = z.strictObject
({
	type: z.literal(ChanType.PUBLIC),
	title: zChanTitle,
	password: zChanPassword.optional(),
})

export const zCreatePrivateChan = z.strictObject
({
	type: z.literal(ChanType.PRIVATE),
	title: zChanTitle.optional(),
})

const zRoleReturn = z.object
({
	users: z.array(zUserName),
	roles: z.array(zRoleName),
	permissions: z.array(z.nativeEnum(PermissionList)),
	roleApplyOn: z.nativeEnum(RoleApplyingType),
	name: z.string()
})

const zChanReturn = z.object
({
	title: zChanTitle.nullable(),
	type: z.nativeEnum(ChanType),
	ownerName: z.string(),
	id: z.string().uuid(),
	users: z.array(zUserName).min(1),
	roles: z.array(zRoleReturn),
})

const zChanDiscussionMessageReturn = z.strictObject
({
	content: z.string(),
	relatedTo: z.string().uuid().nullable(),
	relatedUsers: z.array(zUserName),
	relatedRoles: z.array(z.string())
})

const zChanDiscussionBaseEvent = z.strictObject
({
})

export const zChanDiscussionEventReturn = z.union
([
	zChanDiscussionBaseEvent.extend
	({
		concernedUserName: zUserName.nullable(),
		eventType: z.nativeEnum(ClassicChanEventType),
	}),
	zChanDiscussionBaseEvent.extend
	({
		eventType: z.literal("CHANGED_TITLE"),
		oldTitle: z.string(),
		newTitle: z.string()
	}),
	zChanDiscussionBaseEvent.extend
	({
		eventType: z.literal("DELETED_MESSAGE"),
		deletingUserName: zUserName,
	})
])

const zChanDiscussionBaseElement = z.strictObject
({
	id: z.string().uuid(),
	authorName: zUserName,
	creationDate: z.date(),
})

// shitty work around for prisma lack of union (not event in the road map)
// just that fact alone is enough for me to never use prisma again after
// this projet :(
export const zChanDiscussionElementReturn = z.discriminatedUnion("type",
[
	zChanDiscussionBaseElement.extend	
	({
		type: z.literal('message'),
		message: zChanDiscussionMessageReturn
	}),
	zChanDiscussionBaseElement.extend	
	({
		type: z.literal('event'),
		event: zChanDiscussionEventReturn
	})
])

export const chansContract = c.router
({
	searchChans:
	{
		method: 'GET',
		path: '/',
		summary: 'search for a chan',
		description: 'only chan with type PUBLIC are searchable',
		query: z.strictObject
		({
			titleContains: zChanTitle,
			nResult: z.number().positive().int().max(30).default(10)
		}),
		responses:
		{
			200: z.array(z.object
			({
				passwordProtected: z.boolean(),
				nUsers: z.number().positive().int(),
				id: z.string().uuid(),
				title: zChanTitle,
			}))
		}
	},
	getMyChans:
	{
		method: 'GET',
		path: '/@me',
		responses:
		{
			200: z.array(zChanReturn)
		}
	},
	leaveChan:
	{
		method: 'DELETE',
		path: '/@me/:chanId',
		summary: 'leave a chan',
		pathParams: z.strictObject
		({
			chanId: z.string().uuid()
		}),
		body: c.body<null>(),
		responses:
		{
			202: c.response<null>()
		}
	},
	joinChanById:
	{
		method: 'POST',
		path: '/@me',
		body: z.strictObject
		({
			chanId: z.string().uuid(),
			password: zChanPassword.optional()
		}),
		responses:
		{
			200: zChanReturn
		}
	},
	createChan:
	{
		method: 'POST',
		path: '/',
		summary: 'create a chan',
		body: z.discriminatedUnion("type",
		[
			extendApi(zCreatePublicChan,
			{
				title: "PUBLIC",
			}),
			extendApi(zCreatePrivateChan,
			{
				title: "PRIVATE",
			})
		]),
		responses:
		{
			201: zChanReturn 
		}
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
	deleteChan:
	{
		method: 'DELETE',
		path: '/:chanId',
		summary: 'delete a chan',
		pathParams: z.strictObject
		({ 
			chanId: z.string().uuid()
		}),
		body: c.body<null>(),
		responses:
		{
			202: c.response<null>()
		}
	},
	createChanMessage:
	{
		method: 'POST',
		path: '/:chanId/elements',
		summary: 'post a message to a chan',
		pathParams: z.strictObject
		({
			chanId: z.string().uuid()
		}),
		body: z.strictObject
		({
			content: z.string().nonempty().max(5000),
			relatedTo: z.string().uuid().optional().describe("id of the related msg/event"),
			usersAt: unique(z.array(zUserName).nonempty()).optional(),
			rolesAt: unique(z.array(zRoleName).nonempty()).optional()
		}),
		responses:
		{
			201: zChanDiscussionElementReturn
		}
	},
	getChanElements:
	{
		method: 'GET',
		path: '/:chanId/elements',
		summary: 'get elements by cursor in chan',
		pathParams: z.strictObject
		({
			chanId: z.string().uuid()
		}),
		query: z.strictObject
		({
			nElements: z.number().positive().int().max(50).default(25),
			cursor: z.string().uuid().optional()
		}),
		responses:
		{
			200: z.array(zChanDiscussionElementReturn)
		}
	},
	getChanElementById:
	{
		method: 'GET',
		path: '/:chanId/elements/:elementId',
		pathParams: z.strictObject
		({
			chanId: z.string().uuid(),
			elementId: z.string().uuid()
		}),
		responses:
		{
			200: zChanDiscussionElementReturn
		}
	},
	deleteChanMessage:
	{
		method: 'DELETE',
		path: '/:chanId/elements/:elementId',
		pathParams: z.strictObject
		({
			chanId: z.string().uuid(),
			elementId: z.string().uuid()
		}),
		body: c.body<null>(),
		responses:
		{
			202: zChanDiscussionElementReturn
		}
	},
	kickUserFromChan:
	{
		method: 'DELETE',
		path: '/:chanId/:username',
		pathParams: z.strictObject
		({
			chanId: z.string().uuid(),
			username: zUserName
		}),
		body: c.body<null>(),
		responses:
		{
			202: c.response<null>()
		}
	}
})

export type ChanEvent =
{
	type: 'UPDATED_CHAN' | 'CREATED_CHAN',
	data: z.infer<typeof zChanReturn>
} |
{
	type: 'CREATED_CHAN_ELEMENT' | 'UPDATED_CHAN_ELEMENT',
	data: { chanId: string, element: z.infer<typeof zChanDiscussionElementReturn> }
} |
{
	type: 'DELETED_CHAN' | 'KICKED_FROM_CHAN',
	data: { chanId: string }
}
