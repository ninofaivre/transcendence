import { createZodDto } from "@anatine/zod-nestjs";
import { IsId } from "src/decorator/isId.decorator";
import { id } from "src/zod/id.zod";
import { z } from "zod";


const DeleteChanMessagePathSchema =
z.object
({
	chanId: id,
	msgId: id
}).strict()

export class DeleteChanMessagePathDTO extends createZodDto(DeleteChanMessagePathSchema) {}
