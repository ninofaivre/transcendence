import { createZodDto } from "@anatine/zod-nestjs";
import { IsId } from "src/decorator/isId.decorator";
import { id } from "src/zod/id.zod";
import { z } from "zod";

const LeaveDmPathSchema =
z.object
({
	dmId: id
}).strict()

export class LeaveDmPathDTO extends createZodDto(LeaveDmPathSchema) {}
