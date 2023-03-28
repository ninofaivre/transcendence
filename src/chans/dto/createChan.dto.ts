import { ApiProperty, ApiPropertyOptional, getSchemaPath, ApiExtraModels } from "@nestjs/swagger"
import { Equals, IsEnum, IsOptional, IsString, ValidateNested } from "class-validator"
import { Type } from "class-transformer"
import { IsChanTitle } from "../decorator/isChanTitle.decorator"
import { ChanType } from "@prisma/client"

export class CreatePublicChanDTO
{
	@ApiProperty({
		enum: ChanType,
		default: ChanType.PUBLIC
	})
	@Equals(ChanType.PUBLIC)
	@IsEnum(ChanType)
	type: ChanType

	@ApiProperty({
	})
	@IsChanTitle()
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
		enum: ChanType,
		default: ChanType.PRIVATE
	})
	@Equals(ChanType.PRIVATE)
	@IsEnum(ChanType)
	type: ChanType

	@ApiPropertyOptional({
	})
	@IsOptional()
	@IsChanTitle()
	title?: string
}

export class CreateChanTest
{
	type: ChanType
	title?: string
	password?: string
}

@ApiExtraModels(CreatePrivateChanDTO, CreatePublicChanDTO)
export class CreateChanDTO
{
	@ApiProperty({
		oneOf:
		[
			{ $ref: getSchemaPath(CreatePrivateChanDTO) },
			{ $ref: getSchemaPath(CreatePublicChanDTO) }
		],
	})
	@ValidateNested()
	@Type(null, {
			keepDiscriminatorProperty: true,
			discriminator:
			{
				property: 'type',
				subTypes:
				[
					{
						name: 'PUBLIC',
						value: CreatePublicChanDTO,
					},
					{
						name: 'PRIVATE',
						value: CreatePrivateChanDTO,
					}
				]
			}
		})
	chan: CreatePrivateChanDTO | CreatePublicChanDTO
}
