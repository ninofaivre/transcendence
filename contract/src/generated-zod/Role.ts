import { z } from "zod";
import { PermissionList } from "./enums";
import { CompleteUserInput, CompleteUserOutput, RelatedUserModel, CompleteChanInput, CompleteChanOutput, RelatedChanModel, CompleteChanDiscussionMessageInput, CompleteChanDiscussionMessageOutput, RelatedChanDiscussionMessageModel } from "./index";

export const RoleModel = z.object({
  id: z.string(),
  name: z.string(),
  permissions: z.nativeEnum(PermissionList).array(),
  chanId: z.string(),
});

export interface CompleteRoleInput extends z.input<typeof RoleModel> {
  roles: CompleteRoleInput[];
  rolesSym: CompleteRoleInput[];
  users: CompleteUserInput[];
  chan: CompleteChanInput;
  relatedDiscussionMessage: CompleteChanDiscussionMessageInput[];
}

export interface CompleteRoleOutput extends z.infer<typeof RoleModel> {
  roles: CompleteRoleOutput[];
  rolesSym: CompleteRoleOutput[];
  users: CompleteUserOutput[];
  chan: CompleteChanOutput;
  relatedDiscussionMessage: CompleteChanDiscussionMessageOutput[];
}

/**
 * RelatedRoleModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedRoleModel: z.ZodSchema<CompleteRoleOutput, z.ZodTypeDef, CompleteRoleInput> = z.lazy(() => RoleModel.extend({
  roles: RelatedRoleModel.array(),
  rolesSym: RelatedRoleModel.array(),
  users: RelatedUserModel.array(),
  chan: RelatedChanModel,
  relatedDiscussionMessage: RelatedChanDiscussionMessageModel.array(),
}));
