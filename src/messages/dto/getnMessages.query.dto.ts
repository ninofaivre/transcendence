import { ApiProperty } from "@nestjs/swagger"
import { Type } from "class-transformer"
import { IsInt, Max } from "class-validator"

export class GetnMessagesQueryDTO
{
	@ApiProperty({
		description: 'the start index from the most recent message to the oldest',
		type: 'integer'
	})
	@Type(() => Number)
	@IsInt()
	start: number

	@ApiProperty({
		description: 'the number of messages you want to get',
		maximum: 1000,
		type: 'integer'
	})
	@Type(() => Number)
	@IsInt()
	@Max(1000)
	n: number
}
