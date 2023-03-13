import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { IsInt, IsOptional, Max, Min } from "class-validator"

export class GetnMessagesQueryDTO
{
	@ApiPropertyOptional({
		description: 'the start index from the most recent message to the oldest',
		type: 'integer',
		minimum: 0
	})
	@IsInt()
	@Min(0)
	@IsOptional()
	start?: number

	@ApiPropertyOptional({
		description: 'the number of messages you want to get',
		type: 'integer',
		minimum: 1,
		maximum: 1000
	})
	@IsInt()
	@Max(1000)
	@Min(1)
	@IsOptional()
	n: number = 50
}
