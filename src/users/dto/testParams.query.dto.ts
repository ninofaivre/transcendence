import { IsInt, IsString } from "class-validator";

export class TestParamsQueryDTO
{
	@IsString()
	name: string

	@IsInt()
	id: number
}
