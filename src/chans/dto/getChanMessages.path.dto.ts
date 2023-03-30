import { IsId } from "src/decorator/isId.decorator";

export class GetChanMessagesPathDTO
{
	@IsId()
	chanId: number
}
