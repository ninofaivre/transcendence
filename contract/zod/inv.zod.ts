import { z } from "zod";

export const zInvitationFilter = z.enum(["INCOMING", "OUTCOMING"])
export type zInvitationFilterType = z.infer<typeof zInvitationFilter>
