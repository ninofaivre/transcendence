import { Controller, UseGuards, Request } from '@nestjs/common';
import { NestControllerInterface, NestRequestShapes, TsRest, TsRestRequest, nestControllerContract } from '@ts-rest/nest';
import contract from 'contract/contract';
import { FriendInvitationsService } from './friend-invitations.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { EnrichedRequest } from 'src/auth/auth.service';
import { SseService } from 'src/sse/sse.service';

const c = nestControllerContract(contract.invitations.friend)
type RequestShapes = NestRequestShapes<typeof c>

@Controller()
@TsRest({ jsonQuery: true })
export class FriendInvitationsController implements NestControllerInterface<typeof c>
{

	constructor(private readonly friendInvitationsService: FriendInvitationsService,
			    private readonly sse: SseService) {}

	@UseGuards(JwtAuthGuard)
	@TsRest(c.getFriendInvitations)
	async getFriendInvitations(@Request()req: EnrichedRequest, @TsRestRequest(){ query: { status } }: RequestShapes['getFriendInvitations'])
	{
		const body = await this.friendInvitationsService.getFriendInvitations(req.user.username, status)
		return { status: 200 as const, body }
	}

	@UseGuards(JwtAuthGuard)
	@TsRest(c.getFriendInvitationById)
	async getFriendInvitationById(@Request()req: EnrichedRequest, @TsRestRequest(){ params: { id } }: RequestShapes['getFriendInvitationById'])
	{
		const body = await this.friendInvitationsService.getFriendInvitationById(req.user.username, id)
		return { status: 200 as const, body }
	}

	@UseGuards(JwtAuthGuard)
	@TsRest(c.getFriendInvitationsByType)
	async getFriendInvitationsByType(@Request()req: EnrichedRequest, @TsRestRequest(){ params: { type }, query: { status } }: RequestShapes['getFriendInvitationsByType'])
	{
		const body = await this.friendInvitationsService.getFriendInvitationsByType(req.user.username, type, status)
		return { status: 200 as const, body }
	}

	@UseGuards(JwtAuthGuard)
	@TsRest(c.createFriendInvitation)
	async createFriendInvitation(@Request()req: EnrichedRequest, @TsRestRequest(){ body: { invitedUserName } }: RequestShapes['createFriendInvitation'])
	{
		const body = await this.friendInvitationsService.createFriendInvitation(req.user.username, invitedUserName)
		await this.sse.pushEvent(invitedUserName, { type: 'CREATED_FRIEND_INVITATION', data: body })
		return { status: 201 as const, body }
	}

	@UseGuards(JwtAuthGuard)
	@TsRest(c.updateIncomingFriendInvitation)
	async updateIncomingFriendInvitation(@Request()req: EnrichedRequest, @TsRestRequest(){ body: { status }, params: { id } }: RequestShapes['updateIncomingFriendInvitation'])
	{
		const body = await this.friendInvitationsService.updateIncomingFriendInvitation(req.user.username, status, id)
		await this.sse.pushEvent(body.invitingUserName, { type: 'UPDATED_FRIEND_INVITATION', data: body })
		return { status: 200 as const, body }
	}

	@UseGuards(JwtAuthGuard)
	@TsRest(c.updateOutcomingFriendInvitation)
	async updateOutcomingFriendInvitation(@Request()req: EnrichedRequest, @TsRestRequest(){ body: { status }, params: { id } }: RequestShapes['updateOutcomingFriendInvitation'])
	{
		const body = await this.friendInvitationsService.updateOutcomingFriendInvitation(req.user.username, status, id)
		await this.sse.pushEvent(body.invitedUserName, { type: 'UPDATED_FRIEND_INVITATION', data: body })
		return { status: 200 as const, body }
	}

}
