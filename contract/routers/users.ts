import { initContract } from "@ts-rest/core";
import { zUserName } from "../zod/user.zod";
import { z } from "zod";

const c = initContract();

const subpath = "/api/users";

export const usersContract = c.router({
  getMe: {
    method: "GET",
    path: `${subpath}/me`,
    responses: {
      200: z.object({
        name: zUserName,
      }),
    },
  },
  signUp: {
    method: "POST",
    path: `${subpath}`,
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
});
