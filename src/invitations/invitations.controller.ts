import { Body, Controller, Delete, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CreateChanInvitationDTO } from './dto/createChanInvitation.dto';
import { DeleteChanInvitationsPathDTO } from './dto/deleteChanInvitation.path.dto';
import { DeleteFriendInvitationPathDTO } from './dto/deleteFriendInvitation.path.dto';
import { GetChanInvitationsPathDTO } from './dto/getChanInvitations.path.dto';
import { GetFriendInvitationsPathDTO } from './dto/getFriendInvitations.path.dto';
import { InvitationsService } from './invitations.service';
import { OneUsernameDTO } from 'src/dto/oneUsername.dto';
import { InvitationFilter } from './zod/invitationFilter.zod';

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
	@Post(`/friend/${InvitationFilter.enum.OUTCOMING}`)
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

	@UseGuards(JwtAuthGuard)
	@Get('/chan')
	async getChanInvitations(@Request()req: any)
	{
		return this.invitationsService.getChanInvitations(req.user.username)
	}

	@UseGuards(JwtAuthGuard)
	@Get('/chan/:type')
	async getChanInvitationsByType(@Request()req: any, @Param()pathDTO: GetChanInvitationsPathDTO)
	{
		return this.invitationsService.getChanInvitations(req.user.username, pathDTO.type)
	}

	@UseGuards(JwtAuthGuard)
	@Post(`/chan/${InvitationFilter.enum.OUTCOMING}`)
	async createChanInvitation(@Request()req: any, @Body()dto: CreateChanInvitationDTO)
	{
		return this.invitationsService.createChanInvitation(req.user.username, dto.usernames, dto.chanId)
	}

	@UseGuards(JwtAuthGuard)
	@Delete('/chan/:chanInvitationType/:chanInvitationId')
	async deleteChanInvitation(@Request()req: any, @Param()pathDTO: DeleteChanInvitationsPathDTO)
	{
		return this.invitationsService.deleteChanInvitation(req.user.username, pathDTO.chanInvitationId, pathDTO.chanInvitationType) 
	}

}
