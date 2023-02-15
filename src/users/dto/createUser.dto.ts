import { ApiProperty } from '@nestjs/swagger'
import { IsString, Length } from 'class-validator'

export class CreateUserDTO 
{
	@ApiProperty({
		description: 'username',
		default: 'bob',
		minimum: 3,
		maximum: 50
	})
	@IsString()
	@Length(3, 50)
	name: string

	@ApiProperty({
		description: 'password',
		default: 'my-secret-password',
		minimum: 8,
		maximum: 150
	})
	@IsString()
	@Length(8, 150)
	password: string
}
