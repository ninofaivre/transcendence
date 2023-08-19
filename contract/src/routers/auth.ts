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
                    code: "Unauthorized",
                })
			},
		},
	},
	{
		pathPrefix: "/auth",
	},
)
