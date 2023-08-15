import { z } from "zod";
import { TimedStatusType } from "./enums";
import { CompleteUserInput, CompleteUserOutput, RelatedUserModel, CompleteChanInput, CompleteChanOutput, RelatedChanModel } from "./index";

export const TimedStatusUserChanModel = z.object({
  id: z.string(),
  type: z.nativeEnum(TimedStatusType),
  creationDate: z.date(),
  untilDate: z.date().nullish(),
  timedUserName: z.string(),
  chanId: z.string(),
});

export interface CompleteTimedStatusUserChanInput extends z.input<typeof TimedStatusUserChanModel> {
  timedUser: CompleteUserInput;
  chan: CompleteChanInput;
}

export interface CompleteTimedStatusUserChanOutput extends z.infer<typeof TimedStatusUserChanModel> {
  timedUser: CompleteUserOutput;
  chan: CompleteChanOutput;
}

/**
 * RelatedTimedStatusUserChanModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedTimedStatusUserChanModel: z.ZodSchema<CompleteTimedStatusUserChanOutput, z.ZodTypeDef, CompleteTimedStatusUserChanInput> = z.lazy(() => TimedStatusUserChanModel.extend({
  timedUser: RelatedUserModel,
  chan: RelatedChanModel,
}));
