import { Body, Controller, Delete, Get, NotImplementedException, Post, Request, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { OneUsernameDTO } from 'src/user/dto/oneUsername.dto';
import { DmsService } from './dms.service';

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

	@ApiTags('me')
	@UseGuards(JwtAuthGuard)
	@Post('/me')
	async joinDm(@Request()req: any)
	{
		throw new NotImplementedException('working on...')
	}

	@ApiTags('me')
	@UseGuards(JwtAuthGuard)
	@Delete('/me/:id')
	async leaveDm(@Request()req: any)
	{
		throw new NotImplementedException('working on...')
	}

	@UseGuards(JwtAuthGuard)
	@Post('/')
	async createDm(@Request()req: any, @Body()dto: OneUsernameDTO)
	{
		return this.dmsService.createDm(req.user.username, dto.username)
	}

	@UseGuards(JwtAuthGuard)
	@Delete('/:id')
	async deleteDm(@Request()req: any)
	{
		throw new NotImplementedException('working on...')
	}
}
