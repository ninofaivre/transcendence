import { Body, Get, Post, UseGuards, ValidationPipe, Sse, MessageEvent, Delete, Param, Query, Res, Next, NotImplementedException } from '@nestjs/common';
import { Controller, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { UserService } from './user.service'
import { CreateUserDTO } from './dto/createUser.dto'
import { Observable, interval, map, finalize } from 'rxjs'
import { OneUsernameDTO } from './dto/oneUsername.dto';
import { ApiParam, ApiResponseProperty, ApiTags } from '@nestjs/swagger';
import { GetBlockedListQueryDTO } from './dto/getBlockedList.query.dto';
import { Username } from './decorator/username.decorator';
import { ChatService } from 'src/chat/chat.service';
import { DiscussionIdPathDTO } from 'src/chat/dto/discussionId.path.dto';
import { GetFriendInvitationsPathDTO } from './dto/getFriendInvitations.path.dto';
import { DeleteFriendInvitationPathDTO } from './dto/deleteFriendInvitation.path.dto';
import { CreateFriendDTO } from './dto/createFriend.dto';
import { DeleteFriendDTO } from './dto/deleteFriend.dto';

@ApiTags('user')
@Controller('user')
export class UserController
{
	constructor(private userService: UserService,
			    private chatService: ChatService) {}

	@UseGuards(JwtAuthGuard)
	@Get('/myName')
	async myName(@Request() req: any)
	{
		return { data : req.user.username }
	}

	@Post('/sign-up')
	async createUser(@Body(ValidationPipe)user: CreateUserDTO)
	{
		return this.userService.createUser(user)
	}

	@UseGuards(JwtAuthGuard)
	@Get('/friendInvitations')
	async getFriendInvitations(@Request()req: any)
	{
		return this.userService.getFriendInvitations(req.user.username)
	}

	@UseGuards(JwtAuthGuard)
	@Post('/friendInvitations/OUTCOMING')
	async createFriendInvitation(@Request()req: any, @Body()dto: OneUsernameDTO)
	{
		return this.userService.createFriendInvitation(req.user.username, dto.username)
	}

	@UseGuards(JwtAuthGuard)
	@Get('/friendInvitations/:type')
	async getIncomingFriendInvitations(@Request()req: any, @Param()pathDTO: GetFriendInvitationsPathDTO)
	{
		return this.userService.getFriendInvitations(req.user.username, pathDTO.type)
	}

	@UseGuards(JwtAuthGuard)
	@Delete('/friendInvitations/:type/:id')
	async deleteFriendInvitation(@Request()req: any, @Param()pathDTO: DeleteFriendInvitationPathDTO)
	{
		return this.userService.deleteFriendInvitation(req.user.username, pathDTO.type, pathDTO.id)
	}

	@UseGuards(JwtAuthGuard)
	@Get('/friends')
	async getFriends(@Request()req: any)
	{
		return this.userService.getFriends(req.user.username)
	}

	@UseGuards(JwtAuthGuard)
	@Post('/friends')
	async createFriend(@Request()req: any, @Body(ValidationPipe)dto: CreateFriendDTO)
	{
		return this.userService.acceptInvitation(req.user.username, dto.invitationId)
	}

	@UseGuards(JwtAuthGuard)
	@Delete('/friends/:friendShipId')
	async deleteFriend(@Request()req: any, @Param(ValidationPipe)dto: DeleteFriendDTO)
	{
		return this.userService.deleteFriend(req.user.username, dto.friendShipId)
	}

	// @UseGuards(JwtAuthGuard)
	// @Get('/blockedUsers')
	// async getBlockedUsers(@Request()req: any, @Query(ValidationPipe)dto: GetBlockedListQueryDTO)
	// {
	// 	return this.userService.getBlockedUsers(req.user.username, dto.filter)
	// }
	//
	// @UseGuards(JwtAuthGuard)
	// @Post('/blockedUsers')
	// async blockUser(@Request()req: any, @Body(ValidationPipe)oneUsernameDTO: OneUsernameDTO)
	// {
	// 	return this.userService.blockUser(req.user.username, oneUsernameDTO.username)
	// }
	//
	// @UseGuards(JwtAuthGuard)
	// @Delete('/blockedUsers/:username')
	// async deleteBlocked(@Request()req: any, @Param(ValidationPipe)oneUsernameDTO: OneUsernameDTO)
	// {
	// 	return this.userService.deleteBlocked(req.user.username, oneUsernameDTO.username)
	// }
	//
	// @ApiTags('chat')
	// @UseGuards(JwtAuthGuard)
	// @Delete('/discussions/:discussionId')
	// async leaveDiscussion(@Request()req: any, @Param(ValidationPipe)dto: DiscussionIdPathDTO)
	// {
	// 	throw new NotImplementedException('working on')
	// 	return this.chatService.removeUserFromDiscussionById(req.user.username, req.user.username, dto.discussionId)
	// }
	//
	@UseGuards(JwtAuthGuard)
	@Sse('/sse')
	sse(@Request()req: any): Observable<MessageEvent>
	{
		console.log("open /users/sse for", req.user.username)
		this.userService.addSubject(req.user.username)
		return this.userService.sendObservable(req.user.username)
			.pipe(finalize(() => this.userService.deleteSubject(req.user.username)))
	}
}
