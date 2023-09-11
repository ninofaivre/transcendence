import { Controller, Request, UseGuards } from "@nestjs/common"
import { JwtAuthGuard } from "src/auth/jwt-auth.guard"
import { DmsService } from "./dms.service"
import {
	TsRest,
	TsRestHandler,
	tsRestHandler,
} from "@ts-rest/nest"
import { contract, isContractError } from "contract"
import { EnrichedRequest } from "src/types"

const c = contract.dms

@Controller()
@TsRest({ jsonQuery: true })
export class DmsController {
	constructor(private readonly dmsService: DmsService) {}

	@UseGuards(JwtAuthGuard)
	@TsRestHandler(c)
	async handler(@EnrichedRequest() { user }: EnrichedRequest) {
		return tsRestHandler(c, {

			getDms: async () => {
				const body = await this.dmsService.getDms(user.username)
				return { status: 200, body }
			},

            // unused at the time
			// createDm: async ({ body: { username } }) => {
			// 	const res = await this.dmsService.createDmIfRightTo(user.username, username)
			// 	return isContractError(res) ? res : { status: 201, body: res }
			// },

			getDmElements: async ({ params: { dmId }, query: { cursor, nElements } }) => {
				const body = await this.dmsService.getDmElements(
					user.username,
					dmId,
					nElements,
					cursor,
				)
				return { status: 200, body }
			},

			createDmMessage: async ({ params: { dmId }, body: { content, relatedTo } }) => {
				const body = await this.dmsService.createDmMessage(
					user,
					dmId,
					content,
					relatedTo,
				)
				return { status: 201, body }
			},

			updateDmMessage: async ({ body: { content }, params: { elementId, dmId } }) => {
				const body = await this.dmsService.updateMessage(
					user,
					dmId,
					elementId,
					content,
				)
				return { status: 200, body }
			},

			deleteDmMessage: async ({ params: { dmId, elementId } }) => {
				const body = await this.dmsService.deleteDmMessage(
					user,
					dmId,
					elementId,
				)
				return { status: 202, body }
			},
		})
	}
}
