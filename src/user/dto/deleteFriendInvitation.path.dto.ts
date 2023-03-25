import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsInt, Min } from "class-validator";
import { InvitationPathType } from "../types/invitationPath.type";

export class DeleteFriendInvitationPathDTO
{
	@ApiProperty({
		enum: InvitationPathType
	})
	@IsEnum(InvitationPathType)
	type: InvitationPathType

	@ApiProperty({
		type: 'integer',
		minimum: 1
	})
	@Min(1)
	@IsInt()
	id: number
}
