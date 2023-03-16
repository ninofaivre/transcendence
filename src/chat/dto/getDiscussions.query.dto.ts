import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum } from "class-validator";

export enum filterType
{
	CHAN = 'CHAN',
	DM = 'DM',
	ALL = 'ALL'
}

export class GetDiscussionsQueryDTO
{
	@ApiPropertyOptional({
		enum: filterType,
		default: filterType['ALL']
	})
	@IsEnum(filterType)
	filter: filterType = filterType['ALL']
}
