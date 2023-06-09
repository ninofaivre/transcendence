import { initContract } from "@ts-rest/core";
import { zUserName } from "../zod/user.zod";
import { z } from "zod";

const c = initContract();

export const usersContract = c.router({
  getMe: {
    method: "GET",
    path: "/me",
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
      password: z.string().min(8).max(150),
    }),
    responses: {
      201: z.object({
        name: zUserName,
      }),
    },
  },
},
{
	pathPrefix: "/users"
});
