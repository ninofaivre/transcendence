import { IsId } from "src/decorator/isId.decorator";

export class DeleteDmMessagePathDTO
{
	@IsId()
	dmId: number

	@IsId()
	msgId: number
}
