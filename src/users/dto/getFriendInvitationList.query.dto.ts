import { ApiPropertyOptional } from "@nestjs/swagger"
import { IsEnum } from "class-validator"

export enum filterType
{
	INCOMING = 'INCOMING',
	OUTCOMING = 'OUTCOMING',
	ALL = 'ALL'
}

export class GetFriendInvitationListQueryDTO
{
	@ApiPropertyOptional({
		enum: filterType,
		default: filterType['ALL']
	})
	@IsEnum(filterType)
	filter: filterType = filterType['ALL']
}
