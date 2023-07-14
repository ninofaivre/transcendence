import { z } from "zod";
import { CompleteUserInput, CompleteUserOutput, RelatedUserModel, CompleteDmDiscussionElementInput, CompleteDmDiscussionElementOutput, RelatedDmDiscussionElementModel } from "./index";

export const DmDiscussionMessageModel = z.object({
  id: z.string(),
  content: z.string(),
  author: z.string(),
  relatedTo: z.string().nullish(),
  modificationDate: z.date(),
});

export interface CompleteDmDiscussionMessageInput extends z.input<typeof DmDiscussionMessageModel> {
  authorRelation: CompleteUserInput;
  related?: CompleteDmDiscussionElementInput | null;
  discussionElement?: CompleteDmDiscussionElementInput | null;
}

export interface CompleteDmDiscussionMessageOutput extends z.infer<typeof DmDiscussionMessageModel> {
  authorRelation: CompleteUserOutput;
  related?: CompleteDmDiscussionElementOutput | null;
  discussionElement?: CompleteDmDiscussionElementOutput | null;
}

/**
 * RelatedDmDiscussionMessageModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedDmDiscussionMessageModel: z.ZodSchema<CompleteDmDiscussionMessageOutput, z.ZodTypeDef, CompleteDmDiscussionMessageInput> = z.lazy(() => DmDiscussionMessageModel.extend({
  authorRelation: RelatedUserModel,
  related: RelatedDmDiscussionElementModel.nullish(),
  discussionElement: RelatedDmDiscussionElementModel.nullish(),
}));
