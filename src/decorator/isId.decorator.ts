import { applyDecorators } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsPositive } from "class-validator";

export function IsId(options = {})
{
	return applyDecorators(
		ApiProperty({
			type: 'integer',
			minimum: 1,
		}),
		IsInt(options),
		IsPositive(options),
	)
}
