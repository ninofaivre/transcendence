import { IsId } from "src/decorator/isId.decorator";

export class DeleteDmPathDTO
{
	@IsId()
	DmId: number
}
