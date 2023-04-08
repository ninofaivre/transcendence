import { IsId } from "src/decorator/isId.decorator";

export class DeleteChanMessagePathDTO
{
	@IsId()
	chanId: number

	@IsId()
	msgId: number
}
