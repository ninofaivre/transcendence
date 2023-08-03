import { Controller, Request, UseGuards } from "@nestjs/common"
import { JwtAuthGuard } from "src/auth/jwt-auth.guard"
import { DmsService } from "./dms.service"
import {
	NestControllerInterface,
	NestRequestShapes,
	TsRest,
	TsRestRequest,
	nestControllerContract,
	TsRestHandler,
	tsRestHandler,
} from "@ts-rest/nest"
import { contract, isContractError } from "contract"
import { EnrichedRequest } from "src/auth/auth.service"

const c = contract.dms

@Controller()
@TsRest({ jsonQuery: true })
export class DmsController {
	constructor(private readonly dmsService: DmsService) {}

	@UseGuards(JwtAuthGuard)
	@TsRestHandler(c)
	async handler(@Request() req: EnrichedRequest) {
		return tsRestHandler(c, {
			searchDms: async ({ query }) => {
				const body = await this.dmsService.searchDms(
					req.user.username,
					query.nResult,
					query.otherUserNameContains,
				)
				return { status: 200, body }
			},

			getDms: async () => {
				const body = await this.dmsService.getDms(req.user.username)
				return { status: 200, body }
			},

			createDm: async ({ body: { username } }) => {
				const res = await this.dmsService.createDmIfRightTo(req.user.username, username)
				return isContractError(res) ? res : { status: 201, body: res }
			},

			getDmElements: async ({ params: { dmId }, query: { cursor, nElements } }) => {
				const body = await this.dmsService.getDmElements(
					req.user.username,
					dmId,
					nElements,
					cursor,
				)
				return { status: 200, body }
			},

			createDmMessage: async ({ params: { dmId }, body: { content, relatedTo } }) => {
				const body = await this.dmsService.createDmMessage(
					req.user.username,
					dmId,
					content,
					relatedTo,
				)
				return { status: 201, body }
			},

			getDmElementById: async ({ params: { dmId, elementId } }) => {
				const body = await this.dmsService.getDmElementById(
					req.user.username,
					dmId,
					elementId,
				)
				return { status: 200, body }
			},

			updateDmMessage: async ({ body: { content }, params: { elementId, dmId } }) => {
				const body = await this.dmsService.updateMessage(
					req.user.username,
					dmId,
					elementId,
					content,
				)
				return { status: 200, body }
			},

			deleteDmMessage: async ({ params: { dmId, elementId } }) => {
				const body = await this.dmsService.deleteDmMessage(
					req.user.username,
					dmId,
					elementId,
				)
				return { status: 202, body }
			},
		})
	}
}
