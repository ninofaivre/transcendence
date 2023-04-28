import { z } from "zod";
import { id } from "src/zod/id.zod";
import { createZodDto } from "@anatine/zod-nestjs";
import { InvitationFilter } from "../zod/invitationFilter.zod";

const DeleteChanInvitationsPathSchema =
z.object
({
	chanInvitationType: InvitationFilter,
	chanInvitationId: id
}).strict()

export class DeleteChanInvitationsPathDTO extends createZodDto(DeleteChanInvitationsPathSchema) {}
