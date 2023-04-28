import { z } from "zod";

export const zDmId = z.coerce.number().positive().int()
