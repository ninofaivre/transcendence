import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { IsId } from "src/decorator/isId.decorator";

export class JoinChanByInvitationDTO
{
	@IsId()
	chanInvitationId: number
}

export class JoinChanByIdDTO
{
	@IsId()
	chanId: number

	@ApiPropertyOptional({
	})
	@IsNotEmpty()
	@IsString()
	@IsOptional()
	password: string
}
