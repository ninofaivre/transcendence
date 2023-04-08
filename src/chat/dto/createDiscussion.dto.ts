import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString, ValidateNested } from "class-validator";
import { Username } from "src/user/decorator/username.decorator";
import { OneUsernameDTO } from "src/user/dto/oneUsername.dto";

export enum discussionEnumType
{
	DM = 'DM',
	PRIVATE_CHAN = 'PRIVATE_CHAN',
	PUBLIC_CHAN = 'PUBLIC_CHAN'
}

export class CreateDirectMessageDTO extends OneUsernameDTO
{}

export class CreatePublicChanDTO
{
	@ApiProperty({
	})
	@IsString()
	title: string

	@ApiPropertyOptional({
	})
	@IsOptional()
	@IsString()
	password?: string
}

export class CreatePrivateChanDTO
{
	@ApiProperty({
	})
	@IsOptional()
	@IsString()
	title?: string
}

export class CreateDiscussionDTO
{
	@ApiPropertyOptional({
	})
	@IsOptional()
	@ValidateNested()
	dm?: CreateDirectMessageDTO

	@ApiPropertyOptional({
	})
	@IsOptional()
	@ValidateNested()
	privateChan?: CreatePrivateChanDTO

	@ApiPropertyOptional({
	})
	@IsOptional()
	@ValidateNested()
	publicChan?: CreatePublicChanDTO
}
