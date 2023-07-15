import { initContract } from "@ts-rest/core"

import { zChanType, zDmPolicyLevelType, zStatusVisibilityLevel } from "prisma-generated"

import { zChanTitle } from "./chans"
import { zUserName, zUserPassword } from "../zod/user.zod"
import { z } from "zod"
import { getErrorForContract, getErrorsForContract } from "../errors"

export type UserEvent = {
	type: "UPDATED_USER_STATUS"
	data: {
		userName: z.infer<typeof zUserName>
		status: z.infer<typeof zUserStatus>
	}
}

const c = initContract()

export const zUserProfilePreviewReturn = z.strictObject({
	userName: zUserName,
})

export const zUserStatus = z.enum(["OFFLINE", "ONLINE", "INVISIBLE"])
export const zUserProfileReturn = zUserProfilePreviewReturn.extend({
	dmPolicyLevel: zDmPolicyLevelType,
	commonChans: z.array(
		z.strictObject({ type: zChanType, title: zChanTitle.nullable(), id: z.string().uuid() }),
	),
	blockedShipId: z.string().uuid().optional(),
	status: zUserStatus,
})

export const zPartialUserProfileReturn = zUserProfileReturn.partial()

export const zMyProfileReturn = z.strictObject({
	userName: zUserName,
	dmPolicyLevel: zDmPolicyLevelType,
	statusVisibilityLevel: zStatusVisibilityLevel,
})

const zSearchUsersQueryBase = z.strictObject({
	userNameContains: z.string().nonempty(),
	nResult: z.number().positive().int().max(30).default(10),
})

export const usersContract = c.router(
	{
		searchUsers: {
			method: "GET",
			path: "/",
			summary: "search for users",
			description: "not finished yet (beta)",
			query: z.union([
				zSearchUsersQueryBase.extend({
					filter: z.strictObject({
						type: z.literal("inc").default("inc"),
						friends: z.boolean().default(true),
						mySelf: z.boolean().default(false),
						blocked: z.boolean().default(true),
						// canStartDm: z.boolean().default(true)
					}),
				}),
				zSearchUsersQueryBase.extend({
					filter: z.strictObject({
						type: z.literal("only"),
						friends: z.boolean().default(false),
						hasDm: z.boolean().default(false),
						blocked: z.boolean().default(false),
						// canStartDm: z.boolean().default(false)
					}),
				}),
			]),
			responses: {
				200: z.array(zUserProfilePreviewReturn),
			},
		},
		getMe: {
			method: "GET",
			path: "/@me",
			responses: {
				200: zMyProfileReturn,
                ...getErrorsForContract(c, [404, "NotFoundUser"])
			},
		},
		getUser: {
			method: "GET",
			path: "/:userName",
			pathParams: z.strictObject({
				userName: zUserName,
			}),
			responses: {
				200: zUserProfileReturn,
                ...getErrorsForContract(c, [404, "NotFoundUser"])
			},
		},
		updateMe: {
			method: "PATCH",
			path: "/@me",
			body: zMyProfileReturn.partial(),
			responses: {
				200: zMyProfileReturn,
                ...getErrorsForContract(c, [404, "NotFoundUser"])
			},
		},
		signUp: {
			method: "POST",
			path: "/",
			body: z.strictObject({
				name: zUserName,
				password: zUserPassword,
			}),
			responses: {
				201: z.object({
					name: zUserName,
				}),
                ...getErrorsForContract(c, [409, "UserAlreadyExist"])
			},
		},
	},
	{
		pathPrefix: "/users",
	},
)
