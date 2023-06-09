import { initContract } from "@ts-rest/core";
import { zUserName } from "contract/zod/user.zod";
import { z } from "zod";

const c = initContract();

export const authContract = c.router({
	logout:
	{
		method: 'GET',
		path: '/logout',
		responses:
		{
			200: c.response<null>()
		}
	},
	login:
	{
		method: 'POST',
		path: '/login',
		body: z.strictObject
		({
			username: zUserName,
			password: z.string()
		}),
		responses:
		{
			202: c.response<null>()
		}
	}
},
{
	pathPrefix: '/auth'
})
