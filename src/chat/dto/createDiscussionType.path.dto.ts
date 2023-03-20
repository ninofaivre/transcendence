import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";

export enum discussionType
{
	CHAN = 'CHAN',
	DM = 'DM'
}

export class CreateDiscussionTypePathDTO
{
	@ApiProperty({
		enum: discussionType
	})
	@IsEnum(discussionType)
	type: discussionType
}
