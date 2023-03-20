import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsInt, Min } from "class-validator";

// export class GetDiscussionByIdPathDTO
// {
// 	@ApiProperty({
// 		enum: filterType,
// 		default: filterType['ALL']
// 	})
// 	@IsEnum(filterType)
// 	type: filterType
//
// 	@ApiProperty({
// 		type: 'integer',
// 		minimum: 1
// 	})
// 	@Min(1)
// 	@IsInt()
// 	id: number
// }
