import { initContract } from "@ts-rest/core"
import { zUserName, zUserPassword } from "../zod/user.zod"
import { z } from "zod"

const c = initContract()

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
