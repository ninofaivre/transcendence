import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";

export enum ChanInvitationType
{
	INCOMING = "INCOMING",
	OUTCOMING = "OUTCOMING"
}

export class GetChanInvitationsPathDTO
{
	@ApiProperty({
		enum: ChanInvitationType
	})
	@IsEnum(ChanInvitationType)
	chanInvitationType: ChanInvitationType
}
