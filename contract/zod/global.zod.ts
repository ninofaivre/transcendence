import type { ZodArray } from "zod"
import { z } from "zod"

export function unique<T extends z.ZodTypeAny>(arg: ZodArray<T, any>) {
	return arg.transform((array) => [...new Set(array)])
}
