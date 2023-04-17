import { createZodDto } from "@anatine/zod-nestjs";
import { id } from "src/zod/id.zod";
import { z } from "zod";

const CreateDmMessagePathSchema =
z.object
({
	dmId: id
}).strict()

export class CreateDmMessagePathDTO extends createZodDto(CreateDmMessagePathSchema) {}
