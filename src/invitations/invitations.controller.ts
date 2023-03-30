import { Body, Controller, Delete, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { OneUsernameDTO } from 'src/user/dto/oneUsername.dto';
import { DeleteFriendInvitationPathDTO } from './dto/deleteFriendInvitation.path.dto';
import { GetFriendInvitationsPathDTO } from './dto/getFriendInvitations.path.dto';
import { InvitationsService } from './invitations.service';
import { InvitationPathType } from './types/invitationPath.type';

@ApiTags('invitations', 'me')
@Controller('invitations')
export class InvitationsController
{

	constructor(private readonly invitationsService: InvitationsService) {}
	

	@UseGuards(JwtAuthGuard)
	@Get('/friend')
	async getFriendInvitations(@Request()req: any)
	{
		return this.invitationsService.getFriendInvitations(req.user.username)
	}

	@UseGuards(JwtAuthGuard)
	@Get('/friend/:type')
	async getFriendInvitationsByType(@Request()req: any, @Param()pathDTO: GetFriendInvitationsPathDTO)
	{
		return this.invitationsService.getFriendInvitations(req.user.username, pathDTO.type)
	}

	@UseGuards(JwtAuthGuard)
	@Post(`/friend/${InvitationPathType.OUTCOMING}`)
	async createFriendInvitation(@Request()req: any, @Body()dto: OneUsernameDTO)
	{
		return this.invitationsService.createFriendInvitation(req.user.username, dto.username)
	}

	@UseGuards(JwtAuthGuard)
	@Delete('/friend/:type/:id')
	async deleteFriendInvitation(@Request()req: any, @Param()pathDTO: DeleteFriendInvitationPathDTO)
	{
		return this.invitationsService.deleteFriendInvitation(req.user.username, pathDTO.type, pathDTO.id)
	}

}
