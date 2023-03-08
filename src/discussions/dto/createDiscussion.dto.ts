import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString } from 'class-validator';
import { UsernameListDTO } from 'src/users/dto/usernameList.dto';

export class CreateDiscussionDTO extends UsernameListDTO
{
	@ApiPropertyOptional({
		default: 'The best discussion title !'
	})
	@IsString()
	title?: string
}
