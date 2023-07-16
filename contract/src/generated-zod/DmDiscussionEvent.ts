import { z } from "zod";
import { CompleteClassicDmDiscussionEventInput, CompleteClassicDmDiscussionEventOutput, RelatedClassicDmDiscussionEventModel, CompleteChanInvitationDmDiscussionEventInput, CompleteChanInvitationDmDiscussionEventOutput, RelatedChanInvitationDmDiscussionEventModel, CompleteDeletedMessageDmDiscussionEventInput, CompleteDeletedMessageDmDiscussionEventOutput, RelatedDeletedMessageDmDiscussionEventModel, CompleteBlockedDmDiscussionEventInput, CompleteBlockedDmDiscussionEventOutput, RelatedBlockedDmDiscussionEventModel, CompleteDmDiscussionElementInput, CompleteDmDiscussionElementOutput, RelatedDmDiscussionElementModel } from "./index";

export const DmDiscussionEventModel = z.object({
  id: z.string(),
  classicDmDiscussionEventId: z.string().nullish(),
  chanInvitationDmDiscussionEventId: z.string().nullish(),
  deletedMessageDmDiscussionEventId: z.string().nullish(),
  blockedDmDiscussionEventId: z.string().nullish(),
});

export interface CompleteDmDiscussionEventInput extends z.input<typeof DmDiscussionEventModel> {
  classicDmDiscussionEvent?: CompleteClassicDmDiscussionEventInput | null;
  chanInvitationDmDiscussionEvent?: CompleteChanInvitationDmDiscussionEventInput | null;
  deletedMessageDmDiscussionEvent?: CompleteDeletedMessageDmDiscussionEventInput | null;
  blockedDmDiscussionEvent?: CompleteBlockedDmDiscussionEventInput | null;
  discussionElement?: CompleteDmDiscussionElementInput | null;
}

export interface CompleteDmDiscussionEventOutput extends z.infer<typeof DmDiscussionEventModel> {
  classicDmDiscussionEvent?: CompleteClassicDmDiscussionEventOutput | null;
  chanInvitationDmDiscussionEvent?: CompleteChanInvitationDmDiscussionEventOutput | null;
  deletedMessageDmDiscussionEvent?: CompleteDeletedMessageDmDiscussionEventOutput | null;
  blockedDmDiscussionEvent?: CompleteBlockedDmDiscussionEventOutput | null;
  discussionElement?: CompleteDmDiscussionElementOutput | null;
}

/**
 * RelatedDmDiscussionEventModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedDmDiscussionEventModel: z.ZodSchema<CompleteDmDiscussionEventOutput, z.ZodTypeDef, CompleteDmDiscussionEventInput> = z.lazy(() => DmDiscussionEventModel.extend({
  classicDmDiscussionEvent: RelatedClassicDmDiscussionEventModel.nullish(),
  chanInvitationDmDiscussionEvent: RelatedChanInvitationDmDiscussionEventModel.nullish(),
  deletedMessageDmDiscussionEvent: RelatedDeletedMessageDmDiscussionEventModel.nullish(),
  blockedDmDiscussionEvent: RelatedBlockedDmDiscussionEventModel.nullish(),
  discussionElement: RelatedDmDiscussionElementModel.nullish(),
}));
