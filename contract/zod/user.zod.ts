import { z } from "zod"

export const zUserName = z.string().nonempty().min(3).max(30)
