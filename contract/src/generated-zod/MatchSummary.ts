import { z } from "zod";
import { CompleteUserInput, CompleteUserOutput, RelatedUserModel } from "./index";

export const MatchSummaryModel = z.object({
  id: z.string(),
  creationDate: z.date(),
  winnerName: z.string(),
  looserName: z.string(),
  winnerScore: z.number().int(),
  looserScore: z.number().int(),
});

export interface CompleteMatchSummaryInput extends z.input<typeof MatchSummaryModel> {
  winner: CompleteUserInput;
  looser: CompleteUserInput;
}

export interface CompleteMatchSummaryOutput extends z.infer<typeof MatchSummaryModel> {
  winner: CompleteUserOutput;
  looser: CompleteUserOutput;
}

/**
 * RelatedMatchSummaryModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedMatchSummaryModel: z.ZodSchema<CompleteMatchSummaryOutput, z.ZodTypeDef, CompleteMatchSummaryInput> = z.lazy(() => MatchSummaryModel.extend({
  winner: RelatedUserModel,
  looser: RelatedUserModel,
}));
