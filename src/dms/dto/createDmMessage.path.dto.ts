import { IsId } from "src/decorator/isId.decorator";

export class CreateDmMessagePathDTO
{
	@IsId()
	dmId: number
}
