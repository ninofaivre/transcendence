import { createZodDto } from "@anatine/zod-nestjs";
import { id } from "src/zod/id.zod";
import { z } from "zod";

const CreateDmMessageSchema =
z.object
({
	content: z.string().nonempty(),
	relatedId: id.optional()
}).strict()

export class CreateDmMessageDTO extends createZodDto(CreateDmMessageSchema) {}
