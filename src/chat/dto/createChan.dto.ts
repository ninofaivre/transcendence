import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";

export class CreateChanDTO
{
	@ApiPropertyOptional({
	})
	@IsOptional()
	@IsString()
	title?: string

	@ApiPropertyOptional({
	})
	@IsOptional()
	@IsString()
	password?: string
}
