import { Request } from '@nestjs/common';
import { Controller, UseGuards } from '@nestjs/common';
import { NestControllerInterface, NestRequestShapes, TsRest, TsRestRequest, nestControllerContract } from '@ts-rest/nest';
import { ChanInvitationsService } from './chan-invitations.service';
import contract from 'contract/contract';
import { EnrichedRequest } from 'src/auth/auth.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { SseService } from 'src/sse/sse.service';

const c = nestControllerContract(contract.invitations.chan)
type RequestShapes = NestRequestShapes<typeof c>

@Controller()
@TsRest({ jsonQuery: true })
export class ChanInvitationsController implements NestControllerInterface<typeof c>
{

	constructor(private readonly chanInvitationsService: ChanInvitationsService,
			    private readonly sse: SseService) {}

	@UseGuards(JwtAuthGuard)
	@TsRest(c.getChanInvitations)
	async getChanInvitations(@Request()req: EnrichedRequest, @TsRestRequest(){ query: { status } }: RequestShapes['getChanInvitations'])
	{
		const body = await this.chanInvitationsService.getChanInvitations(req.user.username, status)
		return { status: 200 as const, body: body }
	}

	@UseGuards(JwtAuthGuard)
	@TsRest(c.getChanInvitationById)
	async getChanInvitationById(@Request()req: EnrichedRequest, @TsRestRequest(){ params: { id } }: RequestShapes['getChanInvitationById'])
	{
		const body = await this.chanInvitationsService.getChanInvitationById(req.user.username, id)
		return { status: 200 as const, body: body }
	}

	@UseGuards(JwtAuthGuard)
	@TsRest(c.getChanInvitationsByType)
	async getChanInvitationsByType(@Request()req: EnrichedRequest, @TsRestRequest(){ params: { type }, query: { status } }: RequestShapes['getChanInvitationsByType'])
	{
		const body = await this.chanInvitationsService.getChanInvitationsByType(req.user.username, type, status)
		return { status: 200 as const, body: body }
	}

	@UseGuards(JwtAuthGuard)
	@TsRest(c.createChanInvitation)
	async createChanInvitation(@Request()req: EnrichedRequest, @TsRestRequest(){ body: { invitedUserName, chanId } }: RequestShapes['createChanInvitation'])
	{
		const body = await this.chanInvitationsService.createChanInvitation(req.user.username, invitedUserName, chanId)
		await this.sse.pushEvent(invitedUserName, { type: 'CREATED_CHAN_INVITATION', data: body })
		return { status: 201 as const, body: body }
	}

	@UseGuards(JwtAuthGuard)
	@TsRest(c.updateIncomingChanInvitation)
	async updateIncomingChanInvitation(@Request()req: EnrichedRequest, @TsRestRequest(){ body: { status }, params: { id } }: RequestShapes['updateIncomingChanInvitation'])
	{
		const body = await this.chanInvitationsService.updateIncomingChanInvitation(req.user.username, status, id)
		await this.sse.pushEvent(body.invitingUserName, { type: 'UPDATED_CHAN_INVITATION', data: body })
		return { status: 200 as const, body: body }
	}

	@UseGuards(JwtAuthGuard)
	@TsRest(c.updateOutcomingChanInvitation)
	async updateOutcomingChanInvitation(@Request()req: EnrichedRequest, @TsRestRequest(){ body: { status }, params: { id } }: RequestShapes['updateOutcomingChanInvitation'])
	{
		const body = await this.chanInvitationsService.updateOutcomingChanInvitation(req.user.username, status, id)
		await this.sse.pushEvent(body.invitedUserName, { type: 'UPDATED_CHAN_INVITATION', data: body })
		return { status: 200 as const, body: body }
	}
}
