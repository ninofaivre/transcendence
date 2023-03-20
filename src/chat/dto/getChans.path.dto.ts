import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";

export enum chanEnumType
{
	PUBLIC = 'PUBLIC',
	PRIVATE = 'PRIVATE'
}

export class GetChansPathDTO
{
	@ApiProperty({
		enum: chanEnumType
	})
	@IsEnum(chanEnumType)
	chanType: chanEnumType
}
