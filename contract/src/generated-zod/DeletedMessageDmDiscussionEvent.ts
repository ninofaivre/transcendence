import { z } from "zod";
import { CompleteUserInput, CompleteUserOutput, RelatedUserModel, CompleteDmDiscussionEventInput, CompleteDmDiscussionEventOutput, RelatedDmDiscussionEventModel } from "./index";

export const DeletedMessageDmDiscussionEventModel = z.object({
  id: z.string(),
  author: z.string(),
});

export interface CompleteDeletedMessageDmDiscussionEventInput extends z.input<typeof DeletedMessageDmDiscussionEventModel> {
  authorRelation: CompleteUserInput;
  dmDiscussionEvent?: CompleteDmDiscussionEventInput | null;
}

export interface CompleteDeletedMessageDmDiscussionEventOutput extends z.infer<typeof DeletedMessageDmDiscussionEventModel> {
  authorRelation: CompleteUserOutput;
  dmDiscussionEvent?: CompleteDmDiscussionEventOutput | null;
}

/**
 * RelatedDeletedMessageDmDiscussionEventModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedDeletedMessageDmDiscussionEventModel: z.ZodSchema<CompleteDeletedMessageDmDiscussionEventOutput, z.ZodTypeDef, CompleteDeletedMessageDmDiscussionEventInput> = z.lazy(() => DeletedMessageDmDiscussionEventModel.extend({
  authorRelation: RelatedUserModel,
  dmDiscussionEvent: RelatedDmDiscussionEventModel.nullish(),
}));
