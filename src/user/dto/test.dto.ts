import { createZodDto } from "@anatine/zod-nestjs"
import { z } from "zod"
import { ChanType } from "@prisma/client"
import { extendApi, generateSchema } from "@anatine/zod-openapi"

const CreatePublicChanSchema = extendApi(
z.object
({
	type: z.literal(ChanType.PUBLIC),
	title: z.string().nonempty(),
	password: z.string().nonempty().optional()
}).strict(),
{
	title: "PUBLIC",
})

const CreatePrivateChanSchema = extendApi(
z.object
({
	type: z.literal(ChanType.PRIVATE),
	title: z.string().optional(),
	password: z.never()
}).strict(),
{
	title: "PRIVATE",
})

const CreateChanSchema = extendApi(
z.discriminatedUnion("type",
[
	CreatePrivateChanSchema,
	CreatePublicChanSchema
]),
{
	// example:
	// {
	// 	"this example works": "nicely"
	// },
	examples:
	[
		{
			PRIVATE:
			{
				"doesn't work": "jklcjk",
				value:
				{
					"doesn't work": "jklcjk"
				}
			}
		},
		{
			PUBLIC:
			{
				"doesn't work": "jklcjk",
				value:
				{
					"doesn't work": "jklcjk"
				}
			}
		}
	]
})

export class CreateChanDTO extends createZodDto(CreateChanSchema) {}
