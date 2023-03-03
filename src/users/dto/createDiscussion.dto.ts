import { ApiProperty } from '@nestjs/swagger'
import { IsString, Length, ArrayMinSize, ArrayMaxSize, ArrayUnique } from 'class-validator'

export class CreateDiscussionDTO
{
	@ApiProperty({
		description: 'list of usernames',
		default: '["test"]',
		minimum: 1,
		maximum: 50
	})
	@ArrayMinSize(1)
	@ArrayMaxSize(50)
	@ArrayUnique()
	@IsString({ each: true })
	@Length(3, 50, { each: true })
	users: number[]
}
/*
*/
