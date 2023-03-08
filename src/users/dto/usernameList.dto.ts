import { ApiProperty } from '@nestjs/swagger'
import { ArrayMinSize, ArrayMaxSize, ArrayUnique } from 'class-validator'
import { Username } from '../decorator/username.decorator'

export class UsernameListDTO 
{
	@ApiProperty({
		description: 'array of usernames',
		default: [ "bob", "joe" ],
		minItems: 1,
		maxItems: 50,
		uniqueItems: true
	})
	@ArrayMinSize(1)
	@ArrayMaxSize(50)
	@ArrayUnique()
	@Username({ each: true })
	users: string[]
}
