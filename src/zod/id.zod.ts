import { z } from "zod";

export const id = z.coerce.number().positive().int()
