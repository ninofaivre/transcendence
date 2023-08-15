import { z } from "zod";
import { ChanType } from "./enums";
import { CompleteUserInput, CompleteUserOutput, RelatedUserModel, CompleteRoleInput, CompleteRoleOutput, RelatedRoleModel, CompleteTimedStatusUserChanInput, CompleteTimedStatusUserChanOutput, RelatedTimedStatusUserChanModel, CompleteChanInvitationInput, CompleteChanInvitationOutput, RelatedChanInvitationModel, CompleteChanDiscussionElementInput, CompleteChanDiscussionElementOutput, RelatedChanDiscussionElementModel } from "./index";

export const ChanModel = z.object({
  id: z.string(),
  type: z.nativeEnum(ChanType),
  title: z.string().nullish(),
  password: z.string().nullish(),
  creationDate: z.date(),
  modificationDate: z.date().nullish(),
  ownerName: z.string(),
});

export interface CompleteChanInput extends z.input<typeof ChanModel> {
  users: CompleteUserInput[];
  roles: CompleteRoleInput[];
  owner: CompleteUserInput;
  timedStatusUsers: CompleteTimedStatusUserChanInput[];
  invitations: CompleteChanInvitationInput[];
  elements: CompleteChanDiscussionElementInput[];
}

export interface CompleteChanOutput extends z.infer<typeof ChanModel> {
  users: CompleteUserOutput[];
  roles: CompleteRoleOutput[];
  owner: CompleteUserOutput;
  timedStatusUsers: CompleteTimedStatusUserChanOutput[];
  invitations: CompleteChanInvitationOutput[];
  elements: CompleteChanDiscussionElementOutput[];
}

/**
 * RelatedChanModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedChanModel: z.ZodSchema<CompleteChanOutput, z.ZodTypeDef, CompleteChanInput> = z.lazy(() => ChanModel.extend({
  users: RelatedUserModel.array(),
  roles: RelatedRoleModel.array(),
  owner: RelatedUserModel,
  timedStatusUsers: RelatedTimedStatusUserChanModel.array(),
  invitations: RelatedChanInvitationModel.array(),
  elements: RelatedChanDiscussionElementModel.array(),
}));
