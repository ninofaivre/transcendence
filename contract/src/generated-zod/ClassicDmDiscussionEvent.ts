import { z } from "zod";
import { ClassicDmEventType } from "./enums";
import { CompleteDmDiscussionEventInput, CompleteDmDiscussionEventOutput, RelatedDmDiscussionEventModel } from "./index";

export const ClassicDmDiscussionEventModel = z.object({
  id: z.string(),
  eventType: z.nativeEnum(ClassicDmEventType),
});

export interface CompleteClassicDmDiscussionEventInput extends z.input<typeof ClassicDmDiscussionEventModel> {
  dmDiscussionEvent?: CompleteDmDiscussionEventInput | null;
}

export interface CompleteClassicDmDiscussionEventOutput extends z.infer<typeof ClassicDmDiscussionEventModel> {
  dmDiscussionEvent?: CompleteDmDiscussionEventOutput | null;
}

/**
 * RelatedClassicDmDiscussionEventModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedClassicDmDiscussionEventModel: z.ZodSchema<CompleteClassicDmDiscussionEventOutput, z.ZodTypeDef, CompleteClassicDmDiscussionEventInput> = z.lazy(() => ClassicDmDiscussionEventModel.extend({
  dmDiscussionEvent: RelatedDmDiscussionEventModel.nullish(),
}));
