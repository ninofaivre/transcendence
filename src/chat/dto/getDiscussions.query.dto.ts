import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";
export enum chanEnumType
{
	PUBLIC = 'PUBLIC',
	PRIVATE = 'PRIVATE',
	ALL = 'ALL'
}

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

	@ApiPropertyOptional({
		enum: chanEnumType
	})
	@IsOptional()
	@IsEnum(chanEnumType)
	chanFilter: chanEnumType = chanEnumType.ALL
}
