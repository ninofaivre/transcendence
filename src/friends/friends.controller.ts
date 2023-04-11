import { Body, Controller, Delete, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CreateFriendDTO } from './dto/createFriend.dto';
import { DeleteFriendPathDTO } from './dto/deleteFriend.path.dto';
import { FriendsService } from './friends.service';

@ApiTags('friends', 'me')
@Controller('friends')
export class FriendsController
{

	constructor(private readonly friendsService: FriendsService) {}


	@UseGuards(JwtAuthGuard)
	@Get('/')
	async getFriends(@Request()req: any)
	{
		return this.friendsService.getFriends(req.user.username)
	}

	@UseGuards(JwtAuthGuard)
	@Post('/')
	async createFriend(@Request()req: any, @Body()dto: CreateFriendDTO)
	{
		return this.friendsService.acceptInvitation(req.user.username, dto.invitationId)
	}

	@UseGuards(JwtAuthGuard)
	@Delete('/:friendShipId')
	async deleteFriend(@Request()req: any, @Param()pathDTO: DeleteFriendPathDTO)
	{
		return this.friendsService.deleteFriend(req.user.username, pathDTO.friendShipId)
	}
}
