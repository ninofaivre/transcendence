import { z } from "zod";
import { id } from "src/zod/id.zod";
import { createZodDto } from "@anatine/zod-nestjs";
import { InvitationFilter } from "../zod/invitationFilter.zod";

const DeleteFriendInvitationPathSchema =
z.object
({
	type: InvitationFilter,
	id: id
})

export class DeleteFriendInvitationPathDTO extends createZodDto(DeleteFriendInvitationPathSchema) {}
