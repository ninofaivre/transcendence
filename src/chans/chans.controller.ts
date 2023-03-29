import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBody, ApiExtraModels, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ChansService } from './chans.service';
import { CreateChanDTO, CreatePrivateChanDTO, CreatePublicChanDTO } from './dto/createChan.dto';
import { DeleteChanPathDTO } from './dto/deleteChan.path.dto';

@ApiTags('chans')
@Controller('chans')
export class ChansController
{

	constructor(private readonly chansService: ChansService) {}


	@ApiTags('me')
	@UseGuards(JwtAuthGuard)
	@Get('/me')
	async getUserChans(@Request()req: any)
	{
		return this.chansService.getUserChans(req.user.username)
	}

	@ApiTags('me')
	@UseGuards(JwtAuthGuard)
	@Delete('/me/:id')
	async leaveChan(@Request()req: any, @Param()dto: DeleteChanPathDTO)
	{
		return this.chansService.leaveChan(req.user.username, dto.id)
	}

	@UseGuards(JwtAuthGuard)
	@Post('/')
	@ApiBody({
		type: CreateChanDTO,
		examples: // TODO find a cleaner way to retrieve CreatePublicChanDTO and CreatePrivateChanDTO examples (mb with $ref)
		{
			PUBLIC:
			{
				value:
				{
					chan:
					{
						type: "PUBLIC",
						title: "MySuperPublicChanTitle",
						password: "MySuperPassword",
					} 
				}
			},
			PRIVATE:
			{
				value:
				{
					chan:
					{
						type: "PRIVATE",
						title: "MySuperPrivateChanTitle",
					} 
				}
			}
		}
	})
	async createChan(@Request()req: any, @Body()dto: CreateChanDTO)
	{
		return this.chansService.createChan(req.user.username, dto.chan)
	}

	@UseGuards(JwtAuthGuard)
	@Delete(':id')
	async deleteChan(@Request()req: any, @Param()pathDTO: DeleteChanPathDTO)
	{
		return this.chansService.deleteChan(req.user.username, pathDTO.id)
	}
}
