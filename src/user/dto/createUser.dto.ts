import { ApiProperty } from '@nestjs/swagger'
import { IsString, Length } from 'class-validator'
import { Username } from '../decorator/username.decorator'

export class CreateUserDTO 
{
	@Username()
	name: string

	@ApiProperty({
		description: 'password',
		default: 'my-secret-password',
		minimum: 8,
		maximum: 150,
		format: 'password'
	})
	@IsString()
	@Length(8, 150)
	password: string
}
