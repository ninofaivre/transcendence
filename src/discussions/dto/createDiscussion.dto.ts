import { ApiProperty } from '@nestjs/swagger'
import { IsString, Length, ArrayMinSize, ArrayMaxSize, ArrayUnique } from 'class-validator'

export class CreateDiscussionDTO
{
	@ApiProperty({
		description: 'list of usernames',
		default: '["bob"]',
		minimum: 1,
		maximum: 1
	})
	@IsString({ each: true })
	@Length(3, 50, { each: true })
	@ArrayMinSize(1)
	@ArrayUnique()
	users: string[]
}
