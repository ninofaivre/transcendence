import { z } from "zod";
import { CompleteChanDiscussionMessageInput, CompleteChanDiscussionMessageOutput, RelatedChanDiscussionMessageModel, CompleteChanDiscussionEventInput, CompleteChanDiscussionEventOutput, RelatedChanDiscussionEventModel, CompleteUserInput, CompleteUserOutput, RelatedUserModel, CompleteChanInput, CompleteChanOutput, RelatedChanModel } from "./index";

export const ChanDiscussionElementModel = z.object({
  id: z.string(),
  messageId: z.string().nullish(),
  eventId: z.string().nullish(),
  authorName: z.string(),
  creationDate: z.date(),
  modificationDate: z.date().nullish(),
  chanId: z.string(),
});

export interface CompleteChanDiscussionElementInput extends z.input<typeof ChanDiscussionElementModel> {
  message?: CompleteChanDiscussionMessageInput | null;
  event?: CompleteChanDiscussionEventInput | null;
  relatedOf: CompleteChanDiscussionMessageInput[];
  author: CompleteUserInput;
  chan: CompleteChanInput;
}

export interface CompleteChanDiscussionElementOutput extends z.infer<typeof ChanDiscussionElementModel> {
  message?: CompleteChanDiscussionMessageOutput | null;
  event?: CompleteChanDiscussionEventOutput | null;
  relatedOf: CompleteChanDiscussionMessageOutput[];
  author: CompleteUserOutput;
  chan: CompleteChanOutput;
}

/**
 * RelatedChanDiscussionElementModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedChanDiscussionElementModel: z.ZodSchema<CompleteChanDiscussionElementOutput, z.ZodTypeDef, CompleteChanDiscussionElementInput> = z.lazy(() => ChanDiscussionElementModel.extend({
  message: RelatedChanDiscussionMessageModel.nullish(),
  event: RelatedChanDiscussionEventModel.nullish(),
  relatedOf: RelatedChanDiscussionMessageModel.array(),
  author: RelatedUserModel,
  chan: RelatedChanModel,
}));
