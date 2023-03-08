import { ApiProperty } from "@nestjs/swagger"
import { IsInt, Max } from "class-validator"

export class GetnMessagesQueryDTO
{
	@ApiProperty({
		description: 'the start index from the most recent message to the oldest',
		type: 'integer'
	})
	@IsInt()
	start: number

	@ApiProperty({
		description: 'the number of messages you want to get',
		maximum: 1000,
		type: 'integer'
	})
	@IsInt()
	@Max(1000)
	n: number
}
