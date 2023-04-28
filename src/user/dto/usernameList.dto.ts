import { ApiProperty } from '@nestjs/swagger'
import { ArrayMinSize, ArrayMaxSize, ArrayUnique, IsArray } from 'class-validator'
// import { Username } from '../decorator/username.decorator'

export class UsernameListDTO {
    // @ApiProperty({
    //     description: 'array of usernames',
    //     default: ["bob", "joe"],
    //     minItems: 1,
    //     maxItems: 50,
    //     uniqueItems: true
    // })
    // @Username({ each: true })
    // @ArrayUnique()
    // @ArrayMaxSize(50)
    // @ArrayMinSize(1)
    // @IsArray()
    // users: string[]
}
