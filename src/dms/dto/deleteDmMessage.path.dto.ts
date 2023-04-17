import { createZodDto } from "@anatine/zod-nestjs"
import { id } from "src/zod/id.zod"
import { z } from "zod"

const DeleteDmMessagePathSchema =
z.object
({
	dmId: id,
	msgId: id
}).strict()

export class DeleteDmMessagePathDTO extends createZodDto(DeleteDmMessagePathSchema) {}
