import { z } from "zod";
import { CompleteUserInput, CompleteUserOutput, RelatedUserModel, CompleteClassicChanDiscussionEventInput, CompleteClassicChanDiscussionEventOutput, RelatedClassicChanDiscussionEventModel, CompleteChangedTitleChanDiscussionEventInput, CompleteChangedTitleChanDiscussionEventOutput, RelatedChangedTitleChanDiscussionEventModel, CompleteDeletedMessageChanDiscussionEventInput, CompleteDeletedMessageChanDiscussionEventOutput, RelatedDeletedMessageChanDiscussionEventModel, CompleteMutedUserChanDiscussionEventInput, CompleteMutedUserChanDiscussionEventOutput, RelatedMutedUserChanDiscussionEventModel, CompleteChanDiscussionElementInput, CompleteChanDiscussionElementOutput, RelatedChanDiscussionElementModel } from "./index";

export const ChanDiscussionEventModel = z.object({
  id: z.string(),
  concernedUserName: z.string().nullish(),
  classicChanDiscussionEventId: z.string().nullish(),
  changedTitleChanDiscussionEventId: z.string().nullish(),
  deletedMessageChanDiscussionEventId: z.string().nullish(),
  mutedUserChanDiscussionEventId: z.string().nullish(),
});

export interface CompleteChanDiscussionEventInput extends z.input<typeof ChanDiscussionEventModel> {
  concernedUser?: CompleteUserInput | null;
  classicChanDiscussionEvent?: CompleteClassicChanDiscussionEventInput | null;
  changedTitleChanDiscussionEvent?: CompleteChangedTitleChanDiscussionEventInput | null;
  deletedMessageChanDiscussionEvent?: CompleteDeletedMessageChanDiscussionEventInput | null;
  mutedUserChanDiscussionEvent?: CompleteMutedUserChanDiscussionEventInput | null;
  discussionElement?: CompleteChanDiscussionElementInput | null;
}

export interface CompleteChanDiscussionEventOutput extends z.infer<typeof ChanDiscussionEventModel> {
  concernedUser?: CompleteUserOutput | null;
  classicChanDiscussionEvent?: CompleteClassicChanDiscussionEventOutput | null;
  changedTitleChanDiscussionEvent?: CompleteChangedTitleChanDiscussionEventOutput | null;
  deletedMessageChanDiscussionEvent?: CompleteDeletedMessageChanDiscussionEventOutput | null;
  mutedUserChanDiscussionEvent?: CompleteMutedUserChanDiscussionEventOutput | null;
  discussionElement?: CompleteChanDiscussionElementOutput | null;
}

/**
 * RelatedChanDiscussionEventModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedChanDiscussionEventModel: z.ZodSchema<CompleteChanDiscussionEventOutput, z.ZodTypeDef, CompleteChanDiscussionEventInput> = z.lazy(() => ChanDiscussionEventModel.extend({
  concernedUser: RelatedUserModel.nullish(),
  classicChanDiscussionEvent: RelatedClassicChanDiscussionEventModel.nullish(),
  changedTitleChanDiscussionEvent: RelatedChangedTitleChanDiscussionEventModel.nullish(),
  deletedMessageChanDiscussionEvent: RelatedDeletedMessageChanDiscussionEventModel.nullish(),
  mutedUserChanDiscussionEvent: RelatedMutedUserChanDiscussionEventModel.nullish(),
  discussionElement: RelatedChanDiscussionElementModel.nullish(),
}));
