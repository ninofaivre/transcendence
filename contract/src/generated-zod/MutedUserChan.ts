import { z } from "zod"
import {
	CompleteUserInput,
	CompleteUserOutput,
	RelatedUserModel,
	CompleteChanInput,
	CompleteChanOutput,
	RelatedChanModel,
} from "./index"

export const MutedUserChanModel = z.object({
	id: z.string(),
	creationDate: z.date(),
	untilDate: z.date().nullish(),
	mutedUserName: z.string(),
	chanId: z.string(),
})

export interface CompleteMutedUserChanInput extends z.input<typeof MutedUserChanModel> {
	mutedUser: CompleteUserInput
	chan: CompleteChanInput
}

export interface CompleteMutedUserChanOutput extends z.infer<typeof MutedUserChanModel> {
	mutedUser: CompleteUserOutput
	chan: CompleteChanOutput
}

/**
 * RelatedMutedUserChanModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedMutedUserChanModel: z.ZodSchema<
	CompleteMutedUserChanOutput,
	z.ZodTypeDef,
	CompleteMutedUserChanInput
> = z.lazy(() =>
	MutedUserChanModel.extend({
		mutedUser: RelatedUserModel,
		chan: RelatedChanModel,
	}),
)
