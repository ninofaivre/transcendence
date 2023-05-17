import { createZodDto } from "@anatine/zod-nestjs";
import { id } from "src/zod/id.zod";
import { z } from "zod";

const CreateChanMessagePathSchema =
z.object
({
	chanId: id
}).strict()

export class CreateChanMessagePathDTO extends createZodDto(CreateChanMessagePathSchema) {}
