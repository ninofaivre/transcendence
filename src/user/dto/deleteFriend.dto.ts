import { ApiProperty } from "@nestjs/swagger";
import { IsInt, Min } from "class-validator";

export class DeleteFriendDTO
{
	@ApiProperty({
		type: 'integer',
		minimum: 1
	})
	@Min(1)
	@IsInt()
	friendShipId: number
}
