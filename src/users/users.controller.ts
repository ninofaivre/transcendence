import { Body, Get, Post, UseGuards, ValidationPipe, Sse, MessageEvent, Delete, Param, Query, Res, Next } from '@nestjs/common';
import { Controller, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { UsersService } from './users.service'
import { CreateUserDTO } from './dto/createUser.dto'
import { Observable, interval, map, finalize } from 'rxjs'
import { OneUsernameDTO } from './dto/oneUsername.dto';
import { ApiParam, ApiResponseProperty, ApiTags } from '@nestjs/swagger';
import { GetFriendInvitationListQueryDTO } from './dto/getFriendInvitationList.query.dto';
import { GetBlockedListQueryDTO } from './dto/getBlockedList.query.dto';
import { Username } from './decorator/username.decorator';

@ApiTags('users')
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
	@Get('/friends')
	async getFriendList(@Request()req: any)
	{
		return this.usersService.getFriendList(req.user.username)
	}

	@UseGuards(JwtAuthGuard)
	@Get('/friendInvitations')
	async getFriendInvitationList(@Request()req: any, @Query(ValidationPipe)dto: GetFriendInvitationListQueryDTO)
	{
		return this.usersService.getFriendInvitationList(req.user.username, dto.filter)
	}

	@UseGuards(JwtAuthGuard)
	@Post('/friendInvitations')
	async createFriendInvitation(@Request()req: any, @Body(ValidationPipe)oneUsernameDTO: OneUsernameDTO)
	{
		return this.usersService.createFriendInvitation(req.user.username, oneUsernameDTO.username)
	}

	@UseGuards(JwtAuthGuard)
	@Delete('/friendInvitations/:username')
	async deleteFriendInvitation(@Request()req: any, @Param(ValidationPipe)oneUsernameDTO: OneUsernameDTO)
	{
		return this.usersService.deleteFriendInvitation(req.user.username, oneUsernameDTO.username)
	}

	@UseGuards(JwtAuthGuard)
	@Post('/friends')
	async createFriend(@Request()req: any, @Body(ValidationPipe)oneUsernameDTO: OneUsernameDTO)
	{
		return this.usersService.createFriend(req.user.username, oneUsernameDTO.username)
	}

	@UseGuards(JwtAuthGuard)
	@Delete('/friends/:username')
	async deleteFriend(@Request()req: any, @Param(ValidationPipe)oneUsernameDTO: OneUsernameDTO)
	{
		return this.usersService.deleteFriend(req.user.username, oneUsernameDTO.username)
	}

	@UseGuards(JwtAuthGuard)
	@Get('/blockedUsers')
	async getBlockedUsers(@Request()req: any, @Query(ValidationPipe)dto: GetBlockedListQueryDTO)
	{
		return this.usersService.getBlockedUsers(req.user.username, dto.filter)
	}

	@UseGuards(JwtAuthGuard)
	@Post('/blockedUsers')
	async blockUser(@Request()req: any, @Body(ValidationPipe)oneUsernameDTO: OneUsernameDTO)
	{
		return this.usersService.blockUser(req.user.username, oneUsernameDTO.username)
	}

	@UseGuards(JwtAuthGuard)
	@Delete('/blockedUsers/:username')
	async deleteBlocked(@Request()req: any, @Param(ValidationPipe)oneUsernameDTO: OneUsernameDTO)
	{
		return this.usersService.deleteBlocked(req.user.username, oneUsernameDTO.username)
	}

	@UseGuards(JwtAuthGuard)
	@Sse('/sse')
	sse(@Request()req: any): Observable<MessageEvent>
	{
		console.log("open /users/sse for", req.user.username)
		this.usersService.addSubject(req.user.username)
		return this.usersService.sendObservable(req.user.username)
			.pipe(finalize(() => this.usersService.deleteSubject(req.user.username)))
	}
}
