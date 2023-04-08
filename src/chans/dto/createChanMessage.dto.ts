import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { ArrayUnique, IsArray, IsNotEmpty, IsOptional, IsString } from "class-validator"
import { IsId } from "src/decorator/isId.decorator"
import { Username } from "src/user/decorator/username.decorator"

export class CreateChanMessageDTO
{
	@ApiProperty({
		example: "my super message"
	})
	@IsNotEmpty()
	@IsString()
	content: string

	@ApiPropertyOptional({
		type: 'integer',
		minimum: 1
	})
	@IsOptional()
	@IsId()
	relatedId?: number

	@ApiPropertyOptional({
		type: 'array',
		items:
		{
			type: 'string'
			// need to describe Username constraintes here
		},
		uniqueItems: true
	})
	@Username({ each: true })
	@ArrayUnique()
	@IsOptional()
	@IsArray()
	usersAt?: string[]
}
