import { createZodDto } from "@anatine/zod-nestjs";
import { z } from "zod";
import { InvitationFilter } from "../zod/invitationFilter.zod";

const GetChanInvitationsPathSchema =
z.object
({
	type: InvitationFilter
}).strict()

export class GetChanInvitationsPathDTO extends createZodDto(GetChanInvitationsPathSchema) {}
