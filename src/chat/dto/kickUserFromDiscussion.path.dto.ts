import { ApiProperty } from "@nestjs/swagger"
import { IsInt, Min } from "class-validator"
import { Username } from "src/users/decorator/username.decorator"

export class KickUserFromDiscussionPathDTO
{
	@ApiProperty({
		type: 'integer'
	})
	@Min(1)
	@IsInt()
	discussionId: number

	@Username()
	username: string
}
