import { extendApi } from "@anatine/zod-openapi";
import { z } from "zod";
import { CreatePrivateChanSchema, CreatePublicChanSchema } from "./createChan.dto";
import { createZodDto } from "@anatine/zod-nestjs";

const UpdateChanSchema = extendApi(
z.discriminatedUnion("type",
[
	CreatePrivateChanSchema.partial().required({ type: true }),
	CreatePublicChanSchema.partial().required({ type: true })
]),
{
})

export class UpdateChanDTO extends createZodDto(UpdateChanSchema) {}
