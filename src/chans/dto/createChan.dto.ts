import { ApiProperty, ApiPropertyOptional, getSchemaPath, ApiExtraModels, IntersectionType, PartialType } from "@nestjs/swagger"
import { Equals, IsEnum, IsOptional, IsString, ValidateNested } from "class-validator"
import { Type } from "class-transformer"
import { IsChanTitle } from "../decorator/isChanTitle.decorator"
import { ChanType } from "@prisma/client"

class CreatePublicChanDTO
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

class CreatePrivateChanDTO
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

export class CreateChanTest extends IntersectionType(PartialType(CreatePrivateChanDTO), PartialType(CreatePublicChanDTO))
{ type: ChanType }

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
	chan: CreateChanTest
}
