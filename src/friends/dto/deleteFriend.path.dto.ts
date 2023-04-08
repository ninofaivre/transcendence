import { IsId } from "src/decorator/isId.decorator";

export class DeleteFriendPathDTO
{
	@IsId()
	friendShipId: number
}
