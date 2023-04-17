import { Body, Controller, Delete, Get, NotImplementedException, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { DmsService } from './dms.service';
import { OneUsernameDTO } from 'src/dto/oneUsername.dto';
import { CreateDmMessageDTO } from './dto/createDmMessage.dto';
import { CreateDmMessagePathDTO } from './dto/createDmMessage.path.dto';
import { DeleteDmMessagePathDTO } from './dto/deleteDmMessage.path.dto';
import { GetDmMessagesPathDTO } from './dto/getDmMessages.path.dto';
import { GetDmMessagesQueryDTO } from './dto/getDmMessages.query.dto';

@ApiTags('dms')
@Controller('dms')
export class DmsController
{
	constructor(private readonly dmsService: DmsService) {}


	@ApiTags('me')
	@UseGuards(JwtAuthGuard)
	@Get('/me')
	async getDms(@Request()req: any)
	{
		return this.dmsService.getDms(req.user.username)
	}

	@UseGuards(JwtAuthGuard)
	@Post('/')
	async createDm(@Request()req: any, @Body()dto: OneUsernameDTO)
	{
		return this.dmsService.createDm(req.user.username, dto.username)
	}

	@UseGuards(JwtAuthGuard)
	@Get('/:dmId/messages')
	async getDmMessages(@Request()req: any, @Param()pathDTO: GetDmMessagesPathDTO, @Query()queryDTO: GetDmMessagesQueryDTO)
	{
		return this.dmsService.getDmMessages(req.user.username, pathDTO.dmId, queryDTO.nMessages, queryDTO.start)
	}

	@UseGuards(JwtAuthGuard)
	@Post('/:dmId/messages')
	async createDmMessage(@Request()req: any, @Param()pathDTO: CreateDmMessagePathDTO, @Body()messageDTO: CreateDmMessageDTO)
	{
		return this.dmsService.createDmMessage(req.user.username, pathDTO.dmId, messageDTO.content, messageDTO.relatedId)
	}

	@UseGuards(JwtAuthGuard)
	@Delete('/:dmId/messages/:msgId')
	async deleteDmMessage(@Request()req: any, @Param()pathDTO: DeleteDmMessagePathDTO)
	{
		this.dmsService.deleteDmMessage(req.user.username, pathDTO.dmId, pathDTO.msgId)
	}
}
