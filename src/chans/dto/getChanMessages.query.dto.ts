import { ApiPropertyOptional } from "@nestjs/swagger"
import { IsInt, IsOptional, IsPositive } from "class-validator"
import { IsId } from "src/decorator/isId.decorator"

export class GetChanMessagesQueryDTO
{
	@ApiPropertyOptional({
		type: 'integer',
		minimum: 1
	})
	@IsOptional()
	@IsId()
	start?: number

	@ApiPropertyOptional({
		type: 'integer',
		minimum: 1,
		default: 50
	})
	@IsOptional()
	@IsPositive()
	@IsInt()
	nMessages: number = 50
}
