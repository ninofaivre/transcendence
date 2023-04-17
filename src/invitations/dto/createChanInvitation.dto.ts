import { createZodDto } from "@anatine/zod-nestjs"
import { id } from "src/zod/id.zod"
import { usernameSet } from "src/zod/username.zod"
import { z } from "zod"

const CreateChanInvitationSchema =
z.object
({
	usernames: usernameSet,
	chanId: id
})

export class CreateChanInvitationDTO extends createZodDto(CreateChanInvitationSchema) {}
