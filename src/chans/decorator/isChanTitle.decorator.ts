import { applyDecorators } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { IsString, NotEquals } from "class-validator";

export function IsChanTitle(options = {})
{
	return applyDecorators(
		ApiProperty({
			description: 'chanTitle',
			example: 'MySuperChanTitle',
			// TODO: need to add 'me' as not allowed value but don't know yet how to achieve this
		}),
		IsString(options),
		NotEquals('me', options)
	)
}
