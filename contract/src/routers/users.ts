import { initContract } from "@ts-rest/core"

import { zChanType, zAccessPolicyLevel } from "../generated-zod"

import { zChanTitle } from "./chans"
import { zUserName, zUserStatus, zUserPassword } from "../zod/user.zod"
import { z } from "zod"
import { getErrorsForContract } from "../errors"
import { StreamableFile } from "@nestjs/common"

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

export const zUserProfileReturn = zUserProfilePreviewReturn.extend({
    // TODO CUSTOM.sql (see usersservice)
	dmPolicyLevel: zAccessPolicyLevel.exclude(["NO_ONE"]),
	commonChans: z.array(
		z.strictObject({ type: zChanType, title: zChanTitle.nullable(), id: z.string().uuid() }),
	),
	blockedShipId: z.string().uuid().optional(),
	status: zUserStatus,
})

export const zPartialUserProfileReturn = zUserProfileReturn.partial()

export const zMyProfileReturn = z.strictObject({
	userName: zUserName,
	dmPolicyLevel: zAccessPolicyLevel.exclude(["NO_ONE"]),
	statusVisibilityLevel: zAccessPolicyLevel,
})

const zSearchUsersQueryBase = z.strictObject({
	userNameContains: z.string().nonempty(),
	nResult: z.number().positive().int().max(30).default(10),
})

export const acceptedProfilePictureMimeTypes = ['image/png', 'image/jpeg'] as const

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
						blockedBy: z.boolean().default(true),
						// canStartDm: z.boolean().default(true)
					}),
				}),
				zSearchUsersQueryBase.extend({
					filter: z.strictObject({
						type: z.literal("only"),
						friends: z.boolean().default(false),
						hasDm: z.boolean().default(false),
						blocked: z.boolean().default(false),
						blockedBy: z.boolean().default(false),
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
				...getErrorsForContract(c, [404, "NotFoundUser"]),
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
				...getErrorsForContract(c, [404, "NotFoundUser"]),
			},
		},
		getUserProfilePicture: {
			method: "GET",
			path: "/:userName/profilePicture",
			pathParams: z.strictObject({
				userName: zUserName,
			}),
			responses: {
				200: c.type<StreamableFile>(),
				...getErrorsForContract(c,
                    [404, "NotFoundProfilePicture", "NotFoundUserForValidToken"]
				),
			},
		},
		updateMe: {
			method: "PATCH",
			path: "/@me",
			// TODO after BH add userName
			body: zMyProfileReturn.omit({ userName: true }).partial(),
			responses: {
				200: zMyProfileReturn,
				...getErrorsForContract(c, [404, "NotFoundUser"]),
			},
		},
		setMyProfilePicture: {
			method: "PUT",
			path: "/@me/PP",
			contentType: "multipart/form-data",
			body: c.type<{ profilePicture: File }>(),
			responses: {
				204: c.type<null>(),
                ...getErrorsForContract(c,
                    [404, "NotFoundProfilePicture", "NotFoundUserForValidToken"],
                    [409, "ServerUnableToWriteProfilePicture"]
                )
			},
		},
		signUp: {
			method: "POST",
			path: "/",
			body: z.strictObject({
				username: zUserName,
				code: z.string(),
			}),
			responses: {
				201: z.object({
					username: zUserName,
                    intraUserName: z.string()
				}),
				...getErrorsForContract(c, [409, "UserAlreadyExist"]),
			},
		},
	},
	{
		pathPrefix: "/users",
	},
)
