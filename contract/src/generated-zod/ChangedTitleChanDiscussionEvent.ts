import { z } from "zod";
import { CompleteChanDiscussionEventInput, CompleteChanDiscussionEventOutput, RelatedChanDiscussionEventModel } from "./index";

export const ChangedTitleChanDiscussionEventModel = z.object({
  id: z.string(),
  oldTitle: z.string(),
  newTitle: z.string(),
});

export interface CompleteChangedTitleChanDiscussionEventInput extends z.input<typeof ChangedTitleChanDiscussionEventModel> {
  chanDiscussionEvent?: CompleteChanDiscussionEventInput | null;
}

export interface CompleteChangedTitleChanDiscussionEventOutput extends z.infer<typeof ChangedTitleChanDiscussionEventModel> {
  chanDiscussionEvent?: CompleteChanDiscussionEventOutput | null;
}

/**
 * RelatedChangedTitleChanDiscussionEventModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedChangedTitleChanDiscussionEventModel: z.ZodSchema<CompleteChangedTitleChanDiscussionEventOutput, z.ZodTypeDef, CompleteChangedTitleChanDiscussionEventInput> = z.lazy(() => ChangedTitleChanDiscussionEventModel.extend({
  chanDiscussionEvent: RelatedChanDiscussionEventModel.nullish(),
}));
