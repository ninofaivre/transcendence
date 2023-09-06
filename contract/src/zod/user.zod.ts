import { z } from "zod"

export const zUserName = z
	.string()
	.nonempty()
	.min(3)
	.max(30)
export const zUserPassword = z.string().nonempty().min(8).max(150)
export const zUserStatus = z.enum(["OFFLINE", "ONLINE", "INVISIBLE", "QUEUE", "GAME"])
