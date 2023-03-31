import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { IsId } from "src/decorator/isId.decorator";
import { ChanInvitationType } from "./getChanInvitations.path.dto";

export class DeleteChanInvitationsPathDTO
{
	@ApiProperty({
		enum: ChanInvitationType
	})
	@IsEnum(ChanInvitationType)
	chanInvitationType: ChanInvitationType

	@IsId()
	chanInvitationId: number
}
