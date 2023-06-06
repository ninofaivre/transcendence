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
	@TsRest(c.getDmMessages)
	async getDmMessages(@Request()req: EnrichedRequest, @TsRestRequest(){ params: { dmId }, query: { cursor, nMessages } }: RequestShapes['getDmMessages'])
	{
		const body = await this.dmsService.getDmMessages(req.user.username, dmId, nMessages, cursor)
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
	@TsRest(c.getOneDmMessage)
	async getOneDmMessage(@Request()req: EnrichedRequest, @TsRestRequest(){ params: { dmId, msgId } }: RequestShapes['getOneDmMessage'])
	{
		const body = await this.dmsService.getOneDmElement(req.user.username, dmId, msgId)
		return { status: 200 as const, body }
	}

	@UseGuards(JwtAuthGuard)
	@TsRest(c.updateOneMessage)
	async updateOneMessage(@Request()req: EnrichedRequest, @TsRestRequest(){ body: { content }, params: { msgId, dmId } }: RequestShapes['updateOneMessage'])
	{
		const body = await this.dmsService.updateOneMessage(req.user.username, dmId, msgId, content)
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
