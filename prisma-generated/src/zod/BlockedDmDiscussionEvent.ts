import { z } from "zod";
import { CompleteUserInput, CompleteUserOutput, RelatedUserModel, CompleteDmDiscussionEventInput, CompleteDmDiscussionEventOutput, RelatedDmDiscussionEventModel } from "./index";

export const BlockedDmDiscussionEventModel = z.object({
  id: z.string(),
  blockingUserName: z.string(),
  blockedUserName: z.string(),
});

export interface CompleteBlockedDmDiscussionEventInput extends z.input<typeof BlockedDmDiscussionEventModel> {
  blockingUser: CompleteUserInput;
  blockedUser: CompleteUserInput;
  dmDiscussionEvent?: CompleteDmDiscussionEventInput | null;
}

export interface CompleteBlockedDmDiscussionEventOutput extends z.infer<typeof BlockedDmDiscussionEventModel> {
  blockingUser: CompleteUserOutput;
  blockedUser: CompleteUserOutput;
  dmDiscussionEvent?: CompleteDmDiscussionEventOutput | null;
}

/**
 * RelatedBlockedDmDiscussionEventModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedBlockedDmDiscussionEventModel: z.ZodSchema<CompleteBlockedDmDiscussionEventOutput, z.ZodTypeDef, CompleteBlockedDmDiscussionEventInput> = z.lazy(() => BlockedDmDiscussionEventModel.extend({
  blockingUser: RelatedUserModel,
  blockedUser: RelatedUserModel,
  dmDiscussionEvent: RelatedDmDiscussionEventModel.nullish(),
}));
