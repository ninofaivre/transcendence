import { Username } from "../decorator/username.decorator";

export class CreateFriendInvitationDTO
{
	@Username()
	username: string
}
