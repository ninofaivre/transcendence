import { Controller, UseGuards, Request } from "@nestjs/common"
import {
	NestControllerInterface,
	NestRequestShapes,
	TsRest,
	TsRestRequest,
	nestControllerContract,
} from "@ts-rest/nest"
import { contract } from "contract"
import { FriendInvitationsService } from "./friend-invitations.service"
import { JwtAuthGuard } from "src/auth/jwt-auth.guard"
import { EnrichedRequest } from "src/types"

const c = nestControllerContract(contract.invitations.friend)
type RequestShapes = NestRequestShapes<typeof c>

@Controller()
@TsRest({ jsonQuery: true })
export class FriendInvitationsController implements NestControllerInterface<typeof c> {
	constructor(private readonly friendInvitationsService: FriendInvitationsService) {}

	@UseGuards(JwtAuthGuard)
	@TsRest(c.getFriendInvitations)
	async getFriendInvitations(
		@Request() req: EnrichedRequest,
		@TsRestRequest() { query: { status } }: RequestShapes["getFriendInvitations"],
	) {
		const body = await this.friendInvitationsService.getFriendInvitations(
			req.user.username,
			status,
		)
		return { status: 200 as const, body }
	}

	@UseGuards(JwtAuthGuard)
	@TsRest(c.createFriendInvitation)
	async createFriendInvitation(
		@EnrichedRequest() req: EnrichedRequest,
		@TsRestRequest() { body: { invitedUserName } }: RequestShapes["createFriendInvitation"],
	) {
		const body = await this.friendInvitationsService.createFriendInvitation(
			req.user,
			invitedUserName,
		)
		return { status: 201 as const, body }
	}

	@UseGuards(JwtAuthGuard)
	@TsRest(c.updateFriendInvitation)
	async updateFriendInvitation(
		@Request() req: EnrichedRequest,
		@TsRestRequest()
		{ body: { status }, params: { id } }: RequestShapes["updateFriendInvitation"],
	) {
		const body = await this.friendInvitationsService.updateFriendInvitation(
			req.user,
			status,
			id,
		)
		return { status: 200 as const, body }
	}
}
