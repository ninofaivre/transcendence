import { Controller, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { DmsService } from './dms.service';
import { NestControllerInterface, NestRequestShapes, TsRest, TsRestRequest, nestControllerContract } from '@ts-rest/nest';
import contract from 'contract/contract';
import { EnrichedRequest } from 'src/auth/auth.service';

const c = nestControllerContract(contract.dms)
type RequestShapes = NestRequestShapes<typeof c>

@Controller()
@TsRest({ jsonQuery: true })
export class DmsController implements NestControllerInterface<typeof c>
{

	constructor(private readonly dmsService: DmsService) {}


	@UseGuards(JwtAuthGuard)
	@TsRest(c.getDms)
	async getDms(@Request()req: EnrichedRequest)
	{
		const body = await this.dmsService.getDms(req.user.username)
		return { status: 200 as const, body }
	}

	// @UseGuards(JwtAuthGuard)
	// @TsRest(c.createDm)
	// async createDm(@Request()req: EnrichedRequest, @TsRestRequest(){ body: { username } }: RequestShapes['createDm'])
	// {
	// 	const body = this.dmsService.createDm(req.user.username, username)
	// 	return { status: 201 as const, body }
	// }

	@UseGuards(JwtAuthGuard)
	@TsRest(c.getDmElements)
	async getDmElements(@Request()req: EnrichedRequest, @TsRestRequest(){ params: { dmId }, query: { cursor, nElements } }: RequestShapes['getDmElements'])
	{
		const body = await this.dmsService.getDmElements(req.user.username, dmId, nElements, cursor)
		return { status: 200 as const, body }
	}

	@UseGuards(JwtAuthGuard)
	@TsRest(c.createDmMessage)
	async createDmMessage(@Request()req: EnrichedRequest, @TsRestRequest(){ params: { dmId }, body: { content, relatedTo } }: RequestShapes['createDmMessage'])
	{
		const body = await this.dmsService.createDmMessage(req.user.username, dmId, content, relatedTo)
		return { status: 201 as const, body }
	}

	@UseGuards(JwtAuthGuard)
	@TsRest(c.getDmElementById)
	async getDmElementById(@Request()req: EnrichedRequest, @TsRestRequest(){ params: { dmId, elementId } }: RequestShapes['getDmElementById'])
	{
		const body = await this.dmsService.getDmElementById(req.user.username, dmId, elementId)
		return { status: 200 as const, body }
	}

	@UseGuards(JwtAuthGuard)
	@TsRest(c.updateMessage)
	async updateMessage(@Request()req: EnrichedRequest, @TsRestRequest(){ body: { content }, params: { elementId, dmId } }: RequestShapes['updateMessage'])
	{
		const body = await this.dmsService.updateMessage(req.user.username, dmId, elementId, content)
		return { status: 200 as const, body }
	}

	@UseGuards(JwtAuthGuard)
	@TsRest(c.deleteDmMessage)
	async deleteDmMessage(@Request()req: EnrichedRequest, @TsRestRequest(){ params: { dmId, messageId } }: RequestShapes['deleteDmMessage'])
	{
		const body = await this.dmsService.deleteDmMessage(req.user.username, dmId, messageId)
		return { status: 202 as const, body }
	}
}
