import { ApiProperty } from '@nestjs/swagger'
import { IsNumber } from 'class-validator'

export class LeaveDiscussionDTO
{
	@ApiProperty({
		description: 'id of the discussion you want to leave',
		default: '69',
	})
	@IsNumber()
	discussionID: number
}
