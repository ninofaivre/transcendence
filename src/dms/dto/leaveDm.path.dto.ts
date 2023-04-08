import { IsId } from "src/decorator/isId.decorator";

export class LeaveDmPathDTO
{
	@IsId()
	DmId: number
}
