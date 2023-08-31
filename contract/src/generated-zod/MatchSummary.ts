import { z } from "zod";
import { CompleteUserInput, CompleteUserOutput, RelatedUserModel } from "./index";

export const MatchSummaryModel = z.object({
  id: z.string(),
  creationDate: z.date(),
  winner_name: z.string(),
  looser_name: z.string(),
  winner_score: z.number().int(),
  looser_score: z.number().int(),
});

export interface CompleteMatchSummaryInput extends z.input<typeof MatchSummaryModel> {
  users: CompleteUserInput[];
}

export interface CompleteMatchSummaryOutput extends z.infer<typeof MatchSummaryModel> {
  users: CompleteUserOutput[];
}

/**
 * RelatedMatchSummaryModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedMatchSummaryModel: z.ZodSchema<CompleteMatchSummaryOutput, z.ZodTypeDef, CompleteMatchSummaryInput> = z.lazy(() => MatchSummaryModel.extend({
  users: RelatedUserModel.array(),
}));
