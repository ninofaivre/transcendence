import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBody, ApiExtraModels, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ChansService } from './chans.service';
import { CreateChanDTO, CreatePrivateChanDTO, CreatePublicChanDTO } from './dto/createChan.dto';
import { CreateChanMessageDTO } from './dto/createChanMessage.dto';
import { CreateChanMessagePathDTO } from './dto/createChanMessage.path.dto';
import { DeleteChanPathDTO } from './dto/deleteChan.path.dto';
import { DeleteChanMessagePathDTO } from './dto/deleteChanMessage.path.dto';
import { GetChanMessagesPathDTO } from './dto/getChanMessages.path.dto';
import { GetChanMessagesQueryDTO } from './dto/getChanMessages.query.dto';
import { KickUserFromChanPathDTO } from './dto/kickUserFromChan.path.dto';

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

	@UseGuards(JwtAuthGuard)
	@Post(':chanId/messages')
	async createChanMessage(@Request()req: any, @Param()pathDTO: CreateChanMessagePathDTO, @Body()dto: CreateChanMessageDTO)
	{
		return this.chansService.createChanMessageIfRightTo(req.user.username, pathDTO.chanId, dto)
	}

	@UseGuards(JwtAuthGuard)
	@Get(':chanId/messages')
	async getChanMessages(@Request()req: any, @Param()pathDTO: GetChanMessagesPathDTO, @Query()queryDTO: GetChanMessagesQueryDTO)
	{
		return this.chansService.getChanMessages(req.user.username, pathDTO.chanId, queryDTO.nMessages, queryDTO.start)
	}

	@UseGuards(JwtAuthGuard)
	@Delete(':chanId/messages/:msgId')
	async deleteChanMessage(@Request()req: any, @Param()pathDTO: DeleteChanMessagePathDTO)
	{
		return this.chansService.deleteChanMessage(req.user.username, pathDTO.chanId, pathDTO.msgId)
	}

	@UseGuards(JwtAuthGuard)
	@Delete(':chanId/users/:username')
	async kickUserFromChan(@Request()req: any, @Param()pathDTO: KickUserFromChanPathDTO)
	{
		return this.chansService.kickUserFromChan(req.user.username, pathDTO.username, pathDTO.chanId) 
	}
}
