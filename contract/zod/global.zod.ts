import { ZodAny, ZodArray, ZodTypeAny, z } from "zod"
import { zUserName } from "./user.zod"
import { zRoleName } from "./chan.zod"
import { EventType } from "@prisma/client"

export const zMessageId = z.coerce.number().positive().int()

const zMessageReturn = z.object
({
	content: z.string().nonempty().max(5000),
	relatedTo: zMessageId.nullable().describe("id of the related msg/event"),
	relatedRoles: z.array(zRoleName),
	relatedUsers: z.array(zUserName),
})

const zEventReturn = z.object
({
	eventType: z.nativeEnum(EventType),
	concernedUser: zUserName.nullable()
})

export const zDiscussionElementReturn = z.object
({
	id: zMessageId,
	author: zUserName,
	creationDate: z.date(),
	event: zEventReturn.nullable(),
	message: zMessageReturn.nullable()
})

export function unique<T extends z.ZodTypeAny>(arg: ZodArray<T, any>)
{
	return arg.transform(array => [...new Set(array)])
}
