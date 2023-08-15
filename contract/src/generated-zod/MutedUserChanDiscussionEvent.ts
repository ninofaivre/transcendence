import { z } from "zod";
import { CompleteUserInput, CompleteUserOutput, RelatedUserModel, CompleteChanDiscussionEventInput, CompleteChanDiscussionEventOutput, RelatedChanDiscussionEventModel } from "./index";

export const MutedUserChanDiscussionEventModel = z.object({
  id: z.string(),
  mutedUserName: z.string(),
  timeoutInMs: z.number().int().nullish(),
});

export interface CompleteMutedUserChanDiscussionEventInput extends z.input<typeof MutedUserChanDiscussionEventModel> {
  mutedUser: CompleteUserInput;
  chanDiscussionEvent?: CompleteChanDiscussionEventInput | null;
}

export interface CompleteMutedUserChanDiscussionEventOutput extends z.infer<typeof MutedUserChanDiscussionEventModel> {
  mutedUser: CompleteUserOutput;
  chanDiscussionEvent?: CompleteChanDiscussionEventOutput | null;
}

/**
 * RelatedMutedUserChanDiscussionEventModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedMutedUserChanDiscussionEventModel: z.ZodSchema<CompleteMutedUserChanDiscussionEventOutput, z.ZodTypeDef, CompleteMutedUserChanDiscussionEventInput> = z.lazy(() => MutedUserChanDiscussionEventModel.extend({
  mutedUser: RelatedUserModel,
  chanDiscussionEvent: RelatedChanDiscussionEventModel.nullish(),
}));
