import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { IsId } from "src/decorator/isId.decorator";

export class CreateDmMessageDTO
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
}
