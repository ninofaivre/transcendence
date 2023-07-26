import { z } from "zod";
import { CompleteUserInput, CompleteUserOutput, RelatedUserModel, CompleteRoleInput, CompleteRoleOutput, RelatedRoleModel, CompleteChanDiscussionElementInput, CompleteChanDiscussionElementOutput, RelatedChanDiscussionElementModel } from "./index";

export const ChanDiscussionMessageModel = z.object({
  id: z.string(),
  content: z.string(),
  relatedTo: z.string().nullish(),
  modificationDate: z.date(),
});

export interface CompleteChanDiscussionMessageInput extends z.input<typeof ChanDiscussionMessageModel> {
  relatedUsers: CompleteUserInput[];
  relatedRoles: CompleteRoleInput[];
  related?: CompleteChanDiscussionElementInput | null;
  discussionElement?: CompleteChanDiscussionElementInput | null;
}

export interface CompleteChanDiscussionMessageOutput extends z.infer<typeof ChanDiscussionMessageModel> {
  relatedUsers: CompleteUserOutput[];
  relatedRoles: CompleteRoleOutput[];
  related?: CompleteChanDiscussionElementOutput | null;
  discussionElement?: CompleteChanDiscussionElementOutput | null;
}

/**
 * RelatedChanDiscussionMessageModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedChanDiscussionMessageModel: z.ZodSchema<CompleteChanDiscussionMessageOutput, z.ZodTypeDef, CompleteChanDiscussionMessageInput> = z.lazy(() => ChanDiscussionMessageModel.extend({
  relatedUsers: RelatedUserModel.array(),
  relatedRoles: RelatedRoleModel.array(),
  related: RelatedChanDiscussionElementModel.nullish(),
  discussionElement: RelatedChanDiscussionElementModel.nullish(),
}));
