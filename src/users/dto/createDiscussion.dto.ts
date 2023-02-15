import { ApiProperty } from '@nestjs/swagger'
import { IsString, Length, ArrayMinSize, ArrayMaxSize, ArrayUnique } from 'class-validator'

export class CreateDiscussionDTO
{
	@ApiProperty({
		description: 'list of usernames',
		default: '["test"]',
		minimum: 1,
		maximum: 1
	})
	users: number[]
}
/*
	@IsString({ each: true })
	@Length(3, 50, { each: true })
	@ArrayMinSize(1)
	@ArrayMaxSize(1)
	@ArrayUnique()
*/
