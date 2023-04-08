import { IsId } from "src/decorator/isId.decorator";

export class GetDmMessagesPathDTO
{
	@IsId()
	dmId: number
}
