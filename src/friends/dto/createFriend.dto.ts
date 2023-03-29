import { IsId } from "src/decorator/isId.decorator";

export class CreateFriendDTO
{
	@IsId()
	invitationId: number
}
