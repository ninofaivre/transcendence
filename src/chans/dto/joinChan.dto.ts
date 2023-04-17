import { createZodDto } from "@anatine/zod-nestjs";
import { id } from "src/zod/id.zod";
import { z } from "zod";

const JoinChanByIdSchema =
z.object
({
	chanId: id,
	password: z.string().nonempty().optional()
}).strict()

export class JoinChanByIdDTO extends createZodDto(JoinChanByIdSchema) {}

const JoinChanByInvitationSchema =
z.object
({
	invitationId: id
})

export class JoinChanByInvitationDTO extends createZodDto(JoinChanByInvitationSchema) {}
