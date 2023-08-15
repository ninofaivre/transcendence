import { z } from "zod";
import { CompleteUserInput, CompleteUserOutput, RelatedUserModel } from "./index";

export const BlockedShipModel = z.object({
  id: z.string(),
  creationDate: z.date(),
  modificationDate: z.date().nullish(),
  blockingUserName: z.string(),
  blockedUserName: z.string(),
});

export interface CompleteBlockedShipInput extends z.input<typeof BlockedShipModel> {
  blockingUser: CompleteUserInput;
  blockedUser: CompleteUserInput;
}

export interface CompleteBlockedShipOutput extends z.infer<typeof BlockedShipModel> {
  blockingUser: CompleteUserOutput;
  blockedUser: CompleteUserOutput;
}

/**
 * RelatedBlockedShipModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedBlockedShipModel: z.ZodSchema<CompleteBlockedShipOutput, z.ZodTypeDef, CompleteBlockedShipInput> = z.lazy(() => BlockedShipModel.extend({
  blockingUser: RelatedUserModel,
  blockedUser: RelatedUserModel,
}));
