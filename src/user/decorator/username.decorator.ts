import { applyDecorators } from '@nestjs/common'
import { ApiProperty } from '@nestjs/swagger'
import { IsString, Length } from 'class-validator'

export function Username(options = {})
{
	return applyDecorators(
		ApiProperty({
			description: 'username',
			default: 'bob',
			minLength: 3,
			maxLength: 50,
		}),
		IsString(options),
		Length(3, 50, options),
	)
}
