import { createZodDto } from "@anatine/zod-nestjs";
import { id } from "src/zod/id.zod";
import { z } from "zod";

const DeleteDmPathSchema =
z.object
({
	dmId: id
}).strict()

export class DeleteDmPathDTO extends createZodDto(DeleteDmPathSchema) {}
