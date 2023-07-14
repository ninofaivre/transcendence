import { z } from "zod";
import { ChanInvitationStatus } from "./enums";
import { CompleteChanInput, CompleteChanOutput, RelatedChanModel, CompleteChanInvitationDmDiscussionEventInput, CompleteChanInvitationDmDiscussionEventOutput, RelatedChanInvitationDmDiscussionEventModel, CompleteUserInput, CompleteUserOutput, RelatedUserModel } from "./index";

export const ChanInvitationModel = z.object({
  id: z.string(),
  creationDate: z.date(),
  modificationDate: z.date().nullish(),
  chanId: z.string(),
  chanTitle: z.string(),
  invitingUserName: z.string(),
  invitedUserName: z.string(),
  status: z.nativeEnum(ChanInvitationStatus),
});

export interface CompleteChanInvitationInput extends z.input<typeof ChanInvitationModel> {
  chan: CompleteChanInput;
  discussionEvent?: CompleteChanInvitationDmDiscussionEventInput | null;
  invitingUser: CompleteUserInput;
  invitedUser: CompleteUserInput;
}

export interface CompleteChanInvitationOutput extends z.infer<typeof ChanInvitationModel> {
  chan: CompleteChanOutput;
  discussionEvent?: CompleteChanInvitationDmDiscussionEventOutput | null;
  invitingUser: CompleteUserOutput;
  invitedUser: CompleteUserOutput;
}

/**
 * RelatedChanInvitationModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedChanInvitationModel: z.ZodSchema<CompleteChanInvitationOutput, z.ZodTypeDef, CompleteChanInvitationInput> = z.lazy(() => ChanInvitationModel.extend({
  chan: RelatedChanModel,
  discussionEvent: RelatedChanInvitationDmDiscussionEventModel.nullish(),
  invitingUser: RelatedUserModel,
  invitedUser: RelatedUserModel,
}));
