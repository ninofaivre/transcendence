import { Body, Get, Post, UseGuards, ValidationPipe, Sse, MessageEvent, Delete, Param, Query } from '@nestjs/common';
import { Controller, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { UsersService } from './users.service'
import { CreateUserDTO } from './dto/createUser.dto'
import { Observable, interval, map } from 'rxjs'
import { OneUsernameDTO } from './dto/oneUsername.dto';
import { ApiParam, ApiResponseProperty } from '@nestjs/swagger';
import { GetFriendInvitationListDTO } from './dto/getFriendInvitationList.dto';

@Controller('users')
export class UsersController
{
	constructor(private usersService: UsersService) {}

	@UseGuards(JwtAuthGuard)
	@Get('/myName')
	async myName(@Request() req: any)
	{
		return { data : req.user.username }
	}

	@Post('/sign-up')
	async createUser(@Body(ValidationPipe)user: CreateUserDTO)
	{
		return this.usersService.createUser(user)
	}

	@UseGuards(JwtAuthGuard)
	@Get('/friendList')
	async getFriendList(@Request()req: any)
	{
		return this.usersService.getFriendList(req.user.username)
	}

	@UseGuards(JwtAuthGuard)
	@Get('/friendInvitationList')
	async getFriendInvitationList(@Request()req: any, @Query(ValidationPipe)dto: GetFriendInvitationListDTO)
	{
		return this.usersService.getFriendInvitationList(req.user.username, dto.filter)
	}

	@UseGuards(JwtAuthGuard)
	@Post('/createFriendInvitation')
	async createFriendInvitation(@Request()req: any, @Body(ValidationPipe)oneUsernameDTO: OneUsernameDTO)
	{
		return this.usersService.createFriendInvitation(req.user.username, oneUsernameDTO.username)
	}

	@UseGuards(JwtAuthGuard)
	@Delete('/deleteFriendInvitation/:username')
	async deleteFriendInvitation(@Request()req: any, @Param('username')username: string)
	{
		return this.usersService.deleteFriendInvitation(req.user.username, username)
	}

	// @UseGuards(JwtAuthGuard)
	// @Post('/testDto')
	// async testDto(@Body(ValidationPipe)usernameListDTO: UsernameListDTO)
	// {
	// 	console.log(usernameListDTO)
	// }

	// @UseGuards(JwtAuthGuard)
	// @Get('/testParams/:id/:name')
	// async testParams(@Query()testParamsQueryDTO: TestParamsQueryDTO)
	// {
	// 	console.log(testParamsQueryDTO)
	// }

	@UseGuards(JwtAuthGuard)
	@Sse('/sse')
	getUpdate(@Request() req: any): Observable<MessageEvent> 
	{
		this.usersService.updateTest[req.user.username] = { discussions: [], messages: [] }
		return interval(1000).pipe(map((_) => ({ data: this.usersService.getUpdate(req.user.username) })))
	}
}
