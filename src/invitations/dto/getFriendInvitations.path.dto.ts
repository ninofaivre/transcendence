import { createZodDto } from "@anatine/zod-nestjs"
import { z } from "zod"
import { InvitationFilter } from "../zod/invitationFilter.zod"

const GetFriendInvitationsPathSchema =
z.object
({
	type: InvitationFilter
})

export class GetFriendInvitationsPathDTO extends createZodDto(GetFriendInvitationsPathSchema) {}
