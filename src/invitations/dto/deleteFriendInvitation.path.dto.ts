import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsInt, Min } from "class-validator";
import { IsId } from "src/decorator/isId.decorator";
import { InvitationPathType } from "../types/invitationPath.type";

export class DeleteFriendInvitationPathDTO
{
	@ApiProperty({
		enum: InvitationPathType
	})
	@IsEnum(InvitationPathType)
	type: InvitationPathType

	@IsId()
	id: number
}
