import { IsId } from "src/decorator/isId.decorator";

export class CreateChanMessagePathDTO
{
	@IsId()
	chanId: number
}
