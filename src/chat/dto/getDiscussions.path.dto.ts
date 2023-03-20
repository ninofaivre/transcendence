import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";

export enum discussionEnumType
{
	CHAN = 'CHAN',
	DM = 'DM',
	ALL = 'ALL'
}

export class GetDiscussionsPathDTO
{
	@ApiPropertyOptional({
		enum: discussionEnumType,
		default: discussionEnumType['ALL']
	})
	@IsOptional()
	@IsEnum(discussionEnumType)
	discussionType: discussionEnumType = discussionEnumType['ALL']
}
