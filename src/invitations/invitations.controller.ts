import { Controller, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { InvitationsService } from './invitations.service';
import { NestControllerInterface, NestRequestShapes, TsRest, TsRestRequest, nestControllerContract } from '@ts-rest/nest';
import contract from 'contract/contract';

const c = nestControllerContract(contract.invitations)
type RequestShapes = NestRequestShapes<typeof c>

@Controller()
export class InvitationsController implements NestControllerInterface<typeof c>
{

	constructor(private readonly invitationsService: InvitationsService) {}


	@UseGuards(JwtAuthGuard)
	@TsRest(c.getFriendInvitations)
	async getFriendInvitations(@Request()req: any)
	{
		const body = await this.invitationsService.getAllFriendInvitations(req.user.username)
		return { status: 200 as const, body: body }
	}

	@UseGuards(JwtAuthGuard)
	@TsRest(c.getFriendInvitationsByType)
	async getFriendInvitationsByType(@Request()req: any, @TsRestRequest(){ params: { type } }: RequestShapes['getFriendInvitationsByType'])
	{
		const body = await this.invitationsService.getFriendInvitationsByType(req.user.username, type)
		return { status: 200 as const, body: body }
	}

	@UseGuards(JwtAuthGuard)
	@TsRest(c.createFriendInvitation)
	async createFriendInvitation(@Request()req: any, @TsRestRequest(){ body: { username } }: RequestShapes['createFriendInvitation'])
	{
		const body = await this.invitationsService.createFriendInvitation(req.user.username, username)
		return { status: 201 as const, body: body }
	}

	@UseGuards(JwtAuthGuard)
	@TsRest(c.deleteFriendInvitation)
	async deleteFriendInvitation(@Request()req: any, @TsRestRequest(){ params: { id, type } } :RequestShapes['deleteFriendInvitation'])
	{
		await this.invitationsService.deleteFriendInvitation(req.user.username, type, id)
		return { status: 202 as const, body: null }
	}

	@UseGuards(JwtAuthGuard)
	@TsRest(c.getChanInvitations)
	async getChanInvitations(@Request()req: any)
	{
		const body = await this.invitationsService.getAllChanInvitations(req.user.username)
		return { status: 200 as const, body: body }
	}

	@UseGuards(JwtAuthGuard)
	@TsRest(c.getFriendInvitationsByType)
	async getChanInvitationsByType(@Request()req: any, @TsRestRequest(){ params: { type } }: RequestShapes['getChanInvitationsByType'])
	{
		const body = await this.invitationsService.getChanInvitationsByType(req.user.username, type)
		return { status: 200 as const, body: body }
	}

	@UseGuards(JwtAuthGuard)
	@TsRest(c.createChanInvitation)
	async createChanInvitation(@Request()req: any, @TsRestRequest(){ body: { usernames, chanId } }: RequestShapes['createChanInvitation'])
	{
		const body = await this.invitationsService.createChanInvitation(req.user.username, usernames, chanId)
		return { status: 201 as const, body: body }
	}

	@UseGuards(JwtAuthGuard)
	@TsRest(c.deleteChanInvitation)
	async deleteChanInvitation(@Request()req: any, @TsRestRequest(){ params: { id, type } }: RequestShapes['deleteChanInvitation'])
	{
		await this.invitationsService.deleteChanInvitation(req.user.username, id, type) 
		return { status: 202 as const, body: null }
	}

}
