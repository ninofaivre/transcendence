import { createZodDto } from "@anatine/zod-nestjs"
import { id } from "src/zod/id.zod"
import { usernameSet } from "src/zod/username.zod"
import { z } from "zod"

const CreateChanMessageSchema =
z.object
({
	content: z.string().nonempty(),
	relatedId: id.optional(),
	usersAt: usernameSet.optional()
}).strict()

export class CreateChanMessageDTO extends createZodDto(CreateChanMessageSchema) {}
