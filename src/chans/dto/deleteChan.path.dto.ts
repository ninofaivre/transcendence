import { createZodDto } from "@anatine/zod-nestjs";
import { id } from "src/zod/id.zod";
import { z } from "zod";

const DeleteChanPathSchema =
z.object
({
	id: id
}).strict()

export class DeleteChanPathDTO extends createZodDto(DeleteChanPathSchema) {}
