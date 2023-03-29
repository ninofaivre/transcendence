import { ApiProperty } from "@nestjs/swagger"
import { IsEnum } from "class-validator"
import { InvitationPathType } from "../types/invitationPath.type"

export class GetFriendInvitationsPathDTO
{
	@ApiProperty({
		enum: InvitationPathType,
	})
	@IsEnum(InvitationPathType)
	type: InvitationPathType
}
