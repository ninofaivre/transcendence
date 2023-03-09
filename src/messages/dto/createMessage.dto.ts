import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsString, Min, MinLength } from "class-validator";

export class CreateMessageDTO
{
	// TODO * fix at class-validator level ServerError for -0
	@ApiProperty({
		description: "id of the discussion you are sending a message to",
		default: 69,
		minimum: 0,
		type: 'integer'
	})
	@IsInt()
	@Min(0)
	discussionId: number

	@ApiProperty({
		description: "the message you are sending",
		default: "Hi",
		minLength: 1
	})
	@IsString()
	@MinLength(1)
	content: string
}
