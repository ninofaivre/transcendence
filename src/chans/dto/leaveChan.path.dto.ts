import { createZodDto } from "@anatine/zod-nestjs";
import { id } from "src/zod/id.zod";
import { z } from "zod";

const LeaveChanPathSchema =
z.object
({
	id: id
}).strict()

export class LeaveChanPathDTO extends createZodDto(LeaveChanPathSchema) {}
