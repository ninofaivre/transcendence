import { z } from "zod";
import { CompleteChanInvitationInput, CompleteChanInvitationOutput, RelatedChanInvitationModel, CompleteDmDiscussionEventInput, CompleteDmDiscussionEventOutput, RelatedDmDiscussionEventModel } from "./index";

export const ChanInvitationDmDiscussionEventModel = z.object({
  id: z.string(),
  chanInvitationId: z.string(),
});

export interface CompleteChanInvitationDmDiscussionEventInput extends z.input<typeof ChanInvitationDmDiscussionEventModel> {
  chanInvitation: CompleteChanInvitationInput;
  dmDiscussionEvent?: CompleteDmDiscussionEventInput | null;
}

export interface CompleteChanInvitationDmDiscussionEventOutput extends z.infer<typeof ChanInvitationDmDiscussionEventModel> {
  chanInvitation: CompleteChanInvitationOutput;
  dmDiscussionEvent?: CompleteDmDiscussionEventOutput | null;
}

/**
 * RelatedChanInvitationDmDiscussionEventModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedChanInvitationDmDiscussionEventModel: z.ZodSchema<CompleteChanInvitationDmDiscussionEventOutput, z.ZodTypeDef, CompleteChanInvitationDmDiscussionEventInput> = z.lazy(() => ChanInvitationDmDiscussionEventModel.extend({
  chanInvitation: RelatedChanInvitationModel,
  dmDiscussionEvent: RelatedDmDiscussionEventModel.nullish(),
}));
