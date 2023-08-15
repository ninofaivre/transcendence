import { z } from "zod";
import { ClassicChanEventType } from "./enums";
import { CompleteChanDiscussionEventInput, CompleteChanDiscussionEventOutput, RelatedChanDiscussionEventModel } from "./index";

export const ClassicChanDiscussionEventModel = z.object({
  id: z.string(),
  eventType: z.nativeEnum(ClassicChanEventType),
});

export interface CompleteClassicChanDiscussionEventInput extends z.input<typeof ClassicChanDiscussionEventModel> {
  chanDiscussionEvent?: CompleteChanDiscussionEventInput | null;
}

export interface CompleteClassicChanDiscussionEventOutput extends z.infer<typeof ClassicChanDiscussionEventModel> {
  chanDiscussionEvent?: CompleteChanDiscussionEventOutput | null;
}

/**
 * RelatedClassicChanDiscussionEventModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedClassicChanDiscussionEventModel: z.ZodSchema<CompleteClassicChanDiscussionEventOutput, z.ZodTypeDef, CompleteClassicChanDiscussionEventInput> = z.lazy(() => ClassicChanDiscussionEventModel.extend({
  chanDiscussionEvent: RelatedChanDiscussionEventModel.nullish(),
}));
