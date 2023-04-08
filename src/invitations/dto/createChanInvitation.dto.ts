import { IsId } from "src/decorator/isId.decorator";
import { Username } from "src/user/decorator/username.decorator";

export class CreateChanInvitationDTO
{
	@Username()
	username: string

	@IsId()
	chanId: number
}
