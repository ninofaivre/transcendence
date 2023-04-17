import { extendApi } from "@anatine/zod-openapi";
import { z } from "zod";

export const username = extendApi(z.string().nonempty().min(3).max(50), { example: "bob" })

// transforming the set back to an array because prisma sucks
export const usernameSet = z.set(username).nonempty().transform(usernameSet => [...usernameSet])
