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
import { EnrichedRequest } from "src/types"
import { JwtAuthGuard } from "src/auth/jwt-auth.guard"
import { isContractError } from "contract"

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
	@TsRest(c.createChanInvitation)
	async createChanInvitation(
		@EnrichedRequest(){ user }: EnrichedRequest,
		@TsRestRequest()
		{ body: { invitedUserName, chanId } }: RequestShapes["createChanInvitation"],
	) {
		const body = await this.chanInvitationsService.createChanInvitation(
			user,
			invitedUserName,
			chanId,
		)
        if (isContractError(body))
            return body
		return { status: 201 as const, body }
	}

	@UseGuards(JwtAuthGuard)
	@TsRest(c.updateChanInvitation)
	async updateChanInvitation(
		@EnrichedRequest() req: EnrichedRequest,
		@TsRestRequest()
		{ body: { status }, params: { id } }: RequestShapes["updateChanInvitation"],
	) {
		const body = await this.chanInvitationsService.updateChanInvitation(
			req.user,
			status,
			id,
		)
        if (isContractError(body))
            return body
		return { status: 200 as const, body }
	}
}
