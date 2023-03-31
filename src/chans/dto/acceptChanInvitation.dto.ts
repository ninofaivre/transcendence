import { IsId } from "src/decorator/isId.decorator";

export class AcceptChanInvitationDTO
{
	@IsId()
	chanInvitationId: number
}
