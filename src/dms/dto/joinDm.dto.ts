import { IsId } from "src/decorator/isId.decorator";

export class JoinDmDTO
{
	@IsId()
	DmId: number
}
