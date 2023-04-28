import { z } from "zod";

export const zInvitationFilter = z.enum(["INCOMING", "OUTCOMING"])
export type zInvitationFilterType = z.infer<typeof zInvitationFilter>

export const zChanInvitationId = z.coerce.number().positive().int()
export const zFriendInvitationId = z.coerce.number().positive().int()
