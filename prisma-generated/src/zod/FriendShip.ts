import { z } from "zod";
import { CompleteUserInput, CompleteUserOutput, RelatedUserModel } from "./index";

export const FriendShipModel = z.object({
  id: z.string(),
  creationDate: z.date(),
  modificationDate: z.date().nullish(),
  requestingUserName: z.string(),
  requestedUserName: z.string(),
});

export interface CompleteFriendShipInput extends z.input<typeof FriendShipModel> {
  requestingUser: CompleteUserInput;
  requestedUser: CompleteUserInput;
}

export interface CompleteFriendShipOutput extends z.infer<typeof FriendShipModel> {
  requestingUser: CompleteUserOutput;
  requestedUser: CompleteUserOutput;
}

/**
 * RelatedFriendShipModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedFriendShipModel: z.ZodSchema<CompleteFriendShipOutput, z.ZodTypeDef, CompleteFriendShipInput> = z.lazy(() => FriendShipModel.extend({
  requestingUser: RelatedUserModel,
  requestedUser: RelatedUserModel,
}));
