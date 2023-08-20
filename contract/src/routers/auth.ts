import { initContract } from "@ts-rest/core"
import { zUserName, zUserPassword } from "../zod/user.zod"
import { z } from "zod"

const c = initContract()

export const authContract = c.router(
	{
		logout: {
			method: "GET",
			path: "/logout",
			responses: {
				200: c.type<null>(),
			},
		},
		login: {
			method: "POST",
			path: "/login",
			body: z.strictObject({
                code: z.string()
			}),
			responses: {
				200: z.object({
                    username: zUserName,
                    intraUserName: z.string()
                }),
                401: z.object({
                    code: z.literal("Unauthorized"),
                })
			},
		},
        loginDev: {
            method: "POST",
            path: "/loginDev",
            body: z.object({
                username: zUserName
            }),
            responses: {
                200: z.object({
                    username: zUserName,
                    intraUserName: z.string()
                }),
                404: z.object({
                    code: z.literal("NotFound")
                })
            },
            description: "login route for dev purposes (disabled in prod)"
        }
	},
	{
		pathPrefix: "/auth",
	},
)
