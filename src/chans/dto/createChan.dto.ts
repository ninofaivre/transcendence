import { createZodDto } from "@anatine/zod-nestjs";
import { extendApi } from "@anatine/zod-openapi";
import { ChanType } from "@prisma/client";
import { z } from "zod";

export const CreatePublicChanSchema = extendApi(
z.object
({
	type: z.literal(ChanType.PUBLIC),
	title: z.string().nonempty().refine(title => title !== "me"),
	password: z.string().nonempty().optional().nullable()
}).strict(),
{
	title: "PUBLIC",
})

export const CreatePrivateChanSchema = extendApi(
z.object
({
	type: z.literal(ChanType.PRIVATE),
	title: z.string().optional().nullable(),
	password: z.never()
}).strict(),
{
	title: "PRIVATE",
})

export const CreateChanSchema = extendApi(
z.discriminatedUnion("type",
[
	CreatePrivateChanSchema,
	CreatePublicChanSchema
]),
{
})

export class CreateChanDTO extends createZodDto(CreateChanSchema) {}
