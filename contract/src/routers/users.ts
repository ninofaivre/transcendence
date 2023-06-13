import { initContract } from "@ts-rest/core"
import { zUserName, zUserPassword } from "../zod/user.zod"
import { z } from "zod"
import { zChanTitle, zChanType } from "./chans"
import { dmPolicyLevelType } from "@prisma-generated/enums"

const c = initContract()

export const zUserProfileReturn = z.strictObject({
    dmPolicyLevel: z.nativeEnum(dmPolicyLevelType),
    userName: zUserName,
    commonChans: z.array(z.strictObject({ type: zChanType, title: zChanTitle.nullable(), id: z.string().uuid() })),
    blocked: z.string().uuid().optional()
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
                200: z.array(
                    z.object({
                        userName: zUserName
                    })
                )
            }
        },
		getMe: {
			method: "GET",
			path: "/@me",
			responses: {
				200: z.object({
					name: zUserName,
				}),
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
			},
		},
	},
	{
		pathPrefix: "/users",
	},
)
