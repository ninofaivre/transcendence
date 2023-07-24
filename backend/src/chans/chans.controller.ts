import { Controller, Req, UseGuards } from "@nestjs/common"
import { JwtAuthGuard } from "src/auth/jwt-auth.guard"
import { ChansService } from "./chans.service"
import { contract } from "contract"
import {
	nestControllerContract,
	NestControllerInterface,
	NestRequestShapes,
	TsRest,
	TsRestRequest,
} from "@ts-rest/nest"
import { EnrichedRequest } from "src/auth/auth.service"

const c = nestControllerContract(contract.chans)
type RequestShapes = NestRequestShapes<typeof c>

@Controller()
@TsRest({ jsonQuery: true })
export class ChansController /* implements NestControllerInterface<typeof c>*/ {
	// constructor(private readonly chansService: ChansService) {}

	// @UseGuards(JwtAuthGuard)
	// @TsRest(c.searchChans)
	// async searchChans(
	// 	@TsRestRequest() { query: { titleContains, nResult } }: RequestShapes["searchChans"],
	// ) {
	// 	const body = await this.chansService.searchChans(titleContains, nResult)
	// 	return { status: 200 as const, body }
	// }

	// @UseGuards(JwtAuthGuard)
	// @TsRest(c.getMyChans)
	// async getMyChans(@Req() req: EnrichedRequest) {
	// 	const body = await this.chansService.getUserChans(req.user.username)
	// 	return { status: 200 as const, body }
	// }

	// @UseGuards(JwtAuthGuard)
	// @TsRest(c.leaveChan)
	// async leaveChan(
	// 	@Req() req: EnrichedRequest,
	// 	@TsRestRequest() { params: { chanId } }: RequestShapes["leaveChan"],
	// ) {
	// 	await this.chansService.leaveChan(req.user.username, chanId)
	// 	return { status: 200 as const, body: null }
	// }

	// @UseGuards(JwtAuthGuard)
	// @TsRest(c.joinChanById)
	// async joinChanById(
	// 	@Req() req: EnrichedRequest,
	// 	@TsRestRequest() { body: { chanId, password } }: RequestShapes["joinChanById"],
	// ) {
	// 	const body = await this.chansService.joinChanById(req.user.username, chanId, password)
	// 	return { status: 200 as const, body }
	// }

	// @UseGuards(JwtAuthGuard)
	// @TsRest(c.createChan)
	// async createChan(
	// 	@Req() req: EnrichedRequest,
	// 	@TsRestRequest() { body: requestBody }: RequestShapes["createChan"],
	// ) {
	// 	const responseBody = await this.chansService.createChan(req.user.username, requestBody)
	// 	return { status: 201 as const, body: responseBody }
	// }

	// // @UseGuards(JwtAuthGuard)
	// // @TsRest(c.updateChan)
	// // async updateChan(@Req()req: EnrichedRequest, @TsRestRequest(){ params: { chanId }, body: requestBody }: RequestShapes['updateChan'])
	// // {
	// // 	const responseBody = this.chansService.formatChan(await this.chansService.updateChan(req.user.username, chanId, requestBody))
	// // 	return { status: 204 as const, body: responseBody }
	// // }

	// @UseGuards(JwtAuthGuard)
	// @TsRest(c.deleteChan)
	// async deleteChan(
	// 	@Req() req: EnrichedRequest,
	// 	@TsRestRequest() { params: { chanId } }: RequestShapes["deleteChan"],
	// ) {
	// 	await this.chansService.deleteChan(req.user.username, chanId)
	// 	return { status: 202 as const, body: null }
	// }

	// @UseGuards(JwtAuthGuard)
	// @TsRest(c.createChanMessage)
	// async createChanMessage(
	// 	@Req() req: EnrichedRequest,
	// 	@TsRestRequest()
	// 	{ params: { chanId }, body: requestBody }: RequestShapes["createChanMessage"],
	// ) {
	// 	const body = await this.chansService.createChanMessageIfRightTo(
	// 		req.user.username,
	// 		chanId,
	// 		requestBody,
	// 	)
	// 	return { status: 201 as const, body }
	// }

	// @UseGuards(JwtAuthGuard)
	// @TsRest(c.getChanElements)
	// async getChanElements(
	// 	@Req() req: EnrichedRequest,
	// 	@TsRestRequest()
	// 	{ params: { chanId }, query: { nElements, cursor } }: RequestShapes["getChanElements"],
	// ) {
	// 	const body = await this.chansService.getChanElements(
	// 		req.user.username,
	// 		chanId,
	// 		nElements,
	// 		cursor,
	// 	)
	// 	return { status: 200 as const, body }
	// }

	// @UseGuards(JwtAuthGuard)
	// @TsRest(c.getChanElementById)
	// async getChanElementById(
	// 	@Req() req: EnrichedRequest,
	// 	@TsRestRequest() { params: { chanId, elementId } }: RequestShapes["getChanElementById"],
	// ) {
	// 	const body = await this.chansService.getChanElementById(
	// 		req.user.username,
	// 		chanId,
	// 		elementId,
	// 	)
	// 	return { status: 200 as const, body }
	// }

	// @UseGuards(JwtAuthGuard)
	// @TsRest(c.deleteChanMessage)
	// async deleteChanMessage(
	// 	@Req() req: EnrichedRequest,
	// 	@TsRestRequest() { params: { chanId, elementId } }: RequestShapes["deleteChanMessage"],
	// ) {
	// 	const body = await this.chansService.deleteChanMessage(req.user.username, chanId, elementId)
	// 	return { status: 202 as const, body }
	// }

	// @UseGuards(JwtAuthGuard)
	// @TsRest(c.kickUserFromChan)
	// async kickUserFromChan(
	// 	@Req() req: EnrichedRequest,
	// 	@TsRestRequest() { params: { chanId, username } }: RequestShapes["kickUserFromChan"],
	// ) {
	// 	await this.chansService.kickUserFromChan(req.user.username, username, chanId)
	// 	return { status: 202 as const, body: null }
	// }
}
