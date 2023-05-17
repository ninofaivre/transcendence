import { ChanType } from "@prisma/client";
import { z } from "zod";

export const zChanId = z.coerce.number().positive().int()
export const zMessageId = z.coerce.number().positive().int()
export const zChanTitle = z.string().nonempty().max(50)
export const zChanPassword = z.string().nonempty().min(8).max(150)
export const zRoleName = z.string().nonempty()

export const zCreatePublicChan = z.strictObject
({
	type: z.literal(ChanType.PUBLIC),
	title: zChanTitle,
	password: zChanPassword.optional(),
})

export const zCreatePrivateChan = z.strictObject
({
	type: z.literal(ChanType.PRIVATE),
	title: zChanTitle.optional(),
})
