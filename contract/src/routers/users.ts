import { initContract } from "@ts-rest/core"
import { zUserName, zUserPassword } from "../zod/user.zod"
import { z } from "zod"
import { zChanTitle, zChanType } from "./chans"
import { DmPolicyLevelType, StatusVisibilityLevel } from "@prisma-generated/enums"

const c = initContract()

export const zUserProfilePreviewReturn = z.strictObject({
    userName: zUserName
})

export const zUserStatus = z.enum(["OFFLINE", "ONLINE", "INVISIBLE"])

export const zUserProfileReturn = zUserProfilePreviewReturn.extend({
    dmPolicyLevel: z.nativeEnum(DmPolicyLevelType),
    commonChans: z.array(z.strictObject({ type: zChanType, title: zChanTitle.nullable(), id: z.string().uuid() })),
    blockedShipId: z.string().uuid().optional(),
    status: zUserStatus
})

export const zPartialUserProfileReturn = zUserProfileReturn.partial()

export const zMyProfileReturn = z.strictObject({
    userName: zUserName,
    dmPolicyLevel: z.nativeEnum(DmPolicyLevelType),
    statusVisibilityLevel: z.nativeEnum(StatusVisibilityLevel),
})

export const usersContract = c.router(
	{
        searchUsers: {
            method: "GET",
            path: "/",
            summary: "search for users",
            description: "not finished yet (beta)",
            query: z.strictObject({
                userNameContains: zUserName,
                nResult: z.number().positive().int().max(30).default(10)
            }),
            responses: {
                200: z.array(zUserProfilePreviewReturn)
            }
        },
		getMe: {
			method: "GET",
			path: "/@me",
			responses: {
				200: zMyProfileReturn
            },
		},
        getUser: {
            method: "GET",
            path: "/:userName",
            pathParams: z.strictObject({
                userName: zUserName
            }),
            responses: {
                200: zUserProfileReturn
            }
        },
        updateMe: {
            method: "PATCH",
            path: "/@me",
            body: zMyProfileReturn.partial(),
            responses: {
                200: zMyProfileReturn
            }
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
			},
		},
	},
	{
		pathPrefix: "/users",
	},
)

export type UserEvent = {
    type: "UPDATED_USER_PROFILE",
    data: {
        userName: z.infer<typeof zUserName>,
        userProfile: z.infer<typeof zPartialUserProfileReturn>
    }
}
