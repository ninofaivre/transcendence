import { z } from "zod";
import { DirectMessageStatus } from "./enums";
import { CompleteUserInput, CompleteUserOutput, RelatedUserModel, CompleteDmDiscussionElementInput, CompleteDmDiscussionElementOutput, RelatedDmDiscussionElementModel } from "./index";

export const DirectMessageModel = z.object({
  id: z.string(),
  creationDate: z.date(),
  modificationDate: z.date().nullish(),
  requestingUserName: z.string(),
  requestedUserName: z.string(),
  status: z.nativeEnum(DirectMessageStatus),
});

export interface CompleteDirectMessageInput extends z.input<typeof DirectMessageModel> {
  requestingUser: CompleteUserInput;
  requestedUser: CompleteUserInput;
  elements: CompleteDmDiscussionElementInput[];
}

export interface CompleteDirectMessageOutput extends z.infer<typeof DirectMessageModel> {
  requestingUser: CompleteUserOutput;
  requestedUser: CompleteUserOutput;
  elements: CompleteDmDiscussionElementOutput[];
}

/**
 * RelatedDirectMessageModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedDirectMessageModel: z.ZodSchema<CompleteDirectMessageOutput, z.ZodTypeDef, CompleteDirectMessageInput> = z.lazy(() => DirectMessageModel.extend({
  requestingUser: RelatedUserModel,
  requestedUser: RelatedUserModel,
  elements: RelatedDmDiscussionElementModel.array(),
}));
