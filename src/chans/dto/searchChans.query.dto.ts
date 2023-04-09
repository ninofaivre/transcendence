import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from "class-validator"

export class SearchChansQueryDTO
{
	@ApiProperty({
	})
	@IsNotEmpty()
	@IsString()
	titleContains: string

	@ApiPropertyOptional({
	})
	@Min(1)
	@Max(50)
	@IsOptional()
	@IsInt()
	nResult: number = 10
}
