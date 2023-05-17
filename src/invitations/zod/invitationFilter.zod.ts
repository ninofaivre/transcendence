import { z } from "zod";

export const InvitationFilter = z.enum(["INCOMING", "OUTCOMING"])
export type InvitationFilter = z.infer<typeof InvitationFilter>
