import { z } from "zod";
import { FriendInvitationStatus } from "./enums";
import { CompleteUserInput, CompleteUserOutput, RelatedUserModel } from "./index";

export const FriendInvitationModel = z.object({
  id: z.string(),
  creationDate: z.date(),
  modificationDate: z.date().nullish(),
  invitingUserName: z.string(),
  invitedUserName: z.string(),
  status: z.nativeEnum(FriendInvitationStatus),
});

export interface CompleteFriendInvitationInput extends z.input<typeof FriendInvitationModel> {
  invitingUser: CompleteUserInput;
  invitedUser: CompleteUserInput;
}

export interface CompleteFriendInvitationOutput extends z.infer<typeof FriendInvitationModel> {
  invitingUser: CompleteUserOutput;
  invitedUser: CompleteUserOutput;
}

/**
 * RelatedFriendInvitationModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedFriendInvitationModel: z.ZodSchema<CompleteFriendInvitationOutput, z.ZodTypeDef, CompleteFriendInvitationInput> = z.lazy(() => FriendInvitationModel.extend({
  invitingUser: RelatedUserModel,
  invitedUser: RelatedUserModel,
}));
