import { z } from "zod";

export const zInvitationFilter = z.enum(["INCOMING", "OUTCOMING"])
export type zInvitationFilterType = z.infer<typeof zInvitationFilter>

export const zChanInvitationId = z.number().positive().int()
export const zFriendInvitationId = z.number().positive().int()
