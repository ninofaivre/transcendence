import { IsId } from "src/decorator/isId.decorator";

export class DeleteChanPathDTO
{
	@IsId()
	id: number
}
