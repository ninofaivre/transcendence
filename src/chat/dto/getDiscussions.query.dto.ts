import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";

export enum discussionEnumType
{
	CHAN = 'CHAN',
	DM = 'DM',
	ALL = 'ALL'
}

export class GetDiscussionsQueryDTO
{
	@ApiPropertyOptional({
		enum: discussionEnumType,
	})
	@IsOptional()
	@IsEnum(discussionEnumType)
	discussionFilter: discussionEnumType = discussionEnumType.ALL
}
