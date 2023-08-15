import { z } from "zod";
import { CompleteDmDiscussionMessageInput, CompleteDmDiscussionMessageOutput, RelatedDmDiscussionMessageModel, CompleteDmDiscussionEventInput, CompleteDmDiscussionEventOutput, RelatedDmDiscussionEventModel, CompleteDirectMessageInput, CompleteDirectMessageOutput, RelatedDirectMessageModel } from "./index";

export const DmDiscussionElementModel = z.object({
  id: z.string(),
  messageId: z.string().nullish(),
  eventId: z.string().nullish(),
  creationDate: z.date(),
  directMessageId: z.string(),
});

export interface CompleteDmDiscussionElementInput extends z.input<typeof DmDiscussionElementModel> {
  message?: CompleteDmDiscussionMessageInput | null;
  event?: CompleteDmDiscussionEventInput | null;
  relatedOf: CompleteDmDiscussionMessageInput[];
  directMessage: CompleteDirectMessageInput;
}

export interface CompleteDmDiscussionElementOutput extends z.infer<typeof DmDiscussionElementModel> {
  message?: CompleteDmDiscussionMessageOutput | null;
  event?: CompleteDmDiscussionEventOutput | null;
  relatedOf: CompleteDmDiscussionMessageOutput[];
  directMessage: CompleteDirectMessageOutput;
}

/**
 * RelatedDmDiscussionElementModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedDmDiscussionElementModel: z.ZodSchema<CompleteDmDiscussionElementOutput, z.ZodTypeDef, CompleteDmDiscussionElementInput> = z.lazy(() => DmDiscussionElementModel.extend({
  message: RelatedDmDiscussionMessageModel.nullish(),
  event: RelatedDmDiscussionEventModel.nullish(),
  relatedOf: RelatedDmDiscussionMessageModel.array(),
  directMessage: RelatedDirectMessageModel,
}));
