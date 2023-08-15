import { z } from "zod";
import { CompleteUserInput, CompleteUserOutput, RelatedUserModel, CompleteChanDiscussionEventInput, CompleteChanDiscussionEventOutput, RelatedChanDiscussionEventModel } from "./index";

export const DeletedMessageChanDiscussionEventModel = z.object({
  id: z.string(),
  deletingUserName: z.string(),
});

export interface CompleteDeletedMessageChanDiscussionEventInput extends z.input<typeof DeletedMessageChanDiscussionEventModel> {
  deletingUsers: CompleteUserInput;
  chanDiscussionEvent?: CompleteChanDiscussionEventInput | null;
}

export interface CompleteDeletedMessageChanDiscussionEventOutput extends z.infer<typeof DeletedMessageChanDiscussionEventModel> {
  deletingUsers: CompleteUserOutput;
  chanDiscussionEvent?: CompleteChanDiscussionEventOutput | null;
}

/**
 * RelatedDeletedMessageChanDiscussionEventModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedDeletedMessageChanDiscussionEventModel: z.ZodSchema<CompleteDeletedMessageChanDiscussionEventOutput, z.ZodTypeDef, CompleteDeletedMessageChanDiscussionEventInput> = z.lazy(() => DeletedMessageChanDiscussionEventModel.extend({
  deletingUsers: RelatedUserModel,
  chanDiscussionEvent: RelatedChanDiscussionEventModel.nullish(),
}));
