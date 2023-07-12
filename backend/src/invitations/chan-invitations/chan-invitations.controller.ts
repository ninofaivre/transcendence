import { Request } from "@nestjs/common"
import { Controller, UseGuards } from "@nestjs/common"
import {
	NestControllerInterface,
	NestRequestShapes,
	TsRest,
	TsRestRequest,
	nestControllerContract,
} from "@ts-rest/nest"
import { ChanInvitationsService } from "./chan-invitations.service"
import { contract } from "contract"
import type { EnrichedRequest } from "src/auth/auth.service"
import { JwtAuthGuard } from "src/auth/jwt-auth.guard"

const c = nestControllerContract(contract.invitations.chan)
type RequestShapes = NestRequestShapes<typeof c>

@Controller()
@TsRest({ jsonQuery: true })
export class ChanInvitationsController implements NestControllerInterface<typeof c> {
	constructor(private readonly chanInvitationsService: ChanInvitationsService) {}

	@UseGuards(JwtAuthGuard)
	@TsRest(c.getChanInvitations)
	async getChanInvitations(
		@Request() req: EnrichedRequest,
		@TsRestRequest() { query: { status } }: RequestShapes["getChanInvitations"],
	) {
		const body = await this.chanInvitationsService.getChanInvitations(req.user.username, status)
		return { status: 200 as const, body }
	}

	@UseGuards(JwtAuthGuard)
	@TsRest(c.getChanInvitationById)
	async getChanInvitationById(
		@Request() req: EnrichedRequest,
		@TsRestRequest() { params: { id } }: RequestShapes["getChanInvitationById"],
	) {
		const body = await this.chanInvitationsService.getChanInvitationById(req.user.username, id)
		return { status: 200 as const, body }
	}

	@UseGuards(JwtAuthGuard)
	@TsRest(c.createChanInvitation)
	async createChanInvitation(
		@Request() req: EnrichedRequest,
		@TsRestRequest()
		{ body: { invitedUserName, chanId } }: RequestShapes["createChanInvitation"],
	) {
		const body = await this.chanInvitationsService.createChanInvitation(
			req.user.username,
			invitedUserName,
			chanId,
		)
		return { status: 201 as const, body }
	}

	@UseGuards(JwtAuthGuard)
	@TsRest(c.updateChanInvitation)
	async updateChanInvitation(
		@Request() req: EnrichedRequest,
		@TsRestRequest()
		{ body: { status }, params: { id } }: RequestShapes["updateChanInvitation"],
	) {
		const body = await this.chanInvitationsService.updateChanInvitation(
			req.user.username,
			status,
			id,
		)
		return { status: 200 as const, body }
	}
}
