import { Controller, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { DmsService } from './dms.service';
import { NestRequestShapes, TsRest, TsRestRequest, nestControllerContract } from '@ts-rest/nest';
import contract from 'contract/contract';

const c = nestControllerContract(contract.dms)
type RequestShapes = NestRequestShapes<typeof c>

@Controller()
export class DmsController
{
	//
	// constructor(private readonly dmsService: DmsService) {}
	//
	//
	// @UseGuards(JwtAuthGuard)
	// @TsRest(c.getDms)
	// async getDms(@Request()req: any)
	// {
	// 	const body = this.dmsService.getDms(req.user.username)
	// 	return { status: 200 as const, body: body }
	// }
	//
	// @UseGuards(JwtAuthGuard)
	// @TsRest(c.createDm)
	// async createDm(@Request()req: any, @TsRestRequest(){ body: { username } }: RequestShapes['createDm'])
	// {
	// 	const body = this.dmsService.createDm(req.user.username, username)
	// 	return { status: 201 as const, body: body }
	// }
	//
	// @UseGuards(JwtAuthGuard)
	// @TsRest(c.getDmMessages)
	// async getDmMessages(@Request()req: any, @TsRestRequest(){ params: { dmId }, query: { cursor, nMessages } }: RequestShapes['getDmMessages'])
	// {
	// 	const body = this.dmsService.getDmMessages(req.user.username, dmId, nMessages, cursor)
	// 	return { status: 200 as const, body: body }
	// }
	//
	// @UseGuards(JwtAuthGuard)
	// @TsRest(c.createDmMessage)
	// async createDmMessage(@Request()req: any, @TsRestRequest(){ params: { dmId }, body: { content, relatedTo } }: RequestShapes['createDmMessage'])
	// {
	// 	const body = this.dmsService.createDmMessage(req.user.username, dmId, content, relatedTo)
	// 	return { status: 201 as const, body: body }
	// }
	//
	// @UseGuards(JwtAuthGuard)
	// @TsRest(c.deleteDmMessage)
	// async deleteDmMessage(@Request()req: any, @TsRestRequest(){ params: { dmId, messageId } }: RequestShapes['deleteDmMessage'])
	// {
	// 	await this.dmsService.deleteDmMessage(req.user.username, dmId, messageId)
	// 	return { status: 202 as const, body: null }
	// }
}
