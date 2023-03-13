import { ApiPropertyOptional } from "@nestjs/swagger"
import { IsEnum } from "class-validator"

export enum filterType
{
	BLOCKED = 'BLOCKED',
	BLOCKEDBY = 'BLOCKEDBY',
	ALL = 'ALL'
}

export class GetBlockedListQueryDTO 
{
	@ApiPropertyOptional({
		enum: filterType,
		default: filterType['ALL']
	})
	@IsEnum(filterType)
	filter: filterType = filterType['ALL']
}
