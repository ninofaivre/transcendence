import { Body, Controller, Delete, ForbiddenException, Get, InternalServerErrorException, NotFoundException, NotImplementedException, Param, Patch, Post, Query, Req, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiOkResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ChansService } from './chans.service';
import { CreateChanMessageDTO } from './dto/createChanMessage.dto';
import { CreateChanMessagePathDTO } from './dto/createChanMessage.path.dto';
import { DeleteChanPathDTO } from './dto/deleteChan.path.dto';
import { DeleteChanMessagePathDTO } from './dto/deleteChanMessage.path.dto';
import { GetChanMessagesPathDTO } from './dto/getChanMessages.path.dto';
import { GetChanMessagesQueryDTO } from './dto/getChanMessages.query.dto';
import { JoinChanByIdDTO, JoinChanByInvitationDTO } from './dto/joinChan.dto';
import { KickUserFromChanPathDTO } from './dto/kickUserFromChan.path.dto';
import { SearchChansQueryDTO } from './dto/searchChans.query.dto';
import { LeaveChanPathDTO } from './dto/leaveChan.path.dto';
import contract from 'contract/contract';
import { nestControllerContract, NestControllerInterface, NestRequestShapes, NestResponseShapes, TsRest, TsRestRequest, } from '@ts-rest/nest';
import { zCreatePublicChan } from 'contract/zod/chan.zod';
import { ChanAction } from 'src/casl/casl-ability.factory/casl-ability.factory';

const c = nestControllerContract(contract.chans)
type RequestShapes = NestRequestShapes<typeof c>

@Controller()
export class ChansController implements NestControllerInterface<typeof c>
{

	constructor(private readonly chansService: ChansService) {}

	@UseGuards(JwtAuthGuard)
	@TsRest(c.searchChans)
	async searchChans(@TsRestRequest(){ query: { titleContains, nResult } }: RequestShapes['searchChans'])
	{
		const body = this.chansService.searchChans(titleContains, nResult)
		return { status: 200 as const, body: await body }
	}

	@UseGuards(JwtAuthGuard)
	@TsRest(c.getMyChans)
	async getMyChans(@Req()req: any)
	{
		const body = (await this.chansService.getUserChans(req.user.username))
			.map(el => this.chansService.formatChan(el))
		return { status: 200 as const, body: body }
	}

	@UseGuards(JwtAuthGuard)
	@TsRest(c.leaveChan)
	async leaveChan(@Req()req: any, @TsRestRequest(){ params: { chanId } }: RequestShapes['leaveChan'])
	{
		await this.chansService.leaveChan(req.user.username, chanId)
		return { status: 200 as const, body: null }
	}

	@UseGuards(JwtAuthGuard)
	@TsRest(c.joinChanByInvitation)
	async joinChanByInvitation(@Req()req: any, @TsRestRequest(){ body: { invitationId } }: RequestShapes['joinChanByInvitation'] )
	{
		const body = this.chansService.formatChan(await this.chansService.joinChanByInvitation(req.user.username, invitationId))
		return { status: 200 as const, body: body }
	}

	@UseGuards(JwtAuthGuard)
	@TsRest(c.joinChanById)
	async joinChanById(@Req()req: any, @TsRestRequest(){ body: { chanId, password } }: RequestShapes['joinChanById'])
	{
		const body = this.chansService.formatChan(await this.chansService.joinChanByid(req.user.username, chanId, password))
		return { status: 200 as const, body: body }
	}

	@UseGuards(JwtAuthGuard)
	@TsRest(c.createChan)
	async createChan(@Req()req: any, @TsRestRequest(){ body: requestBody }: RequestShapes['createChan'])
	{
		const responseBody = this.chansService.formatChan(await this.chansService.createChan(req.user.username, requestBody))
		return { status: 201 as const, body: responseBody }
	}

	@UseGuards(JwtAuthGuard)
	@TsRest(c.updateChan)
	async updateChan(@Req()req: any, @TsRestRequest(){ params: { chanId }, body: requestBody }: RequestShapes['updateChan'])
	{ 
		const responseBody = this.chansService.formatChan(await this.chansService.updateChan(req.user.username, chanId, requestBody))
		return { status: 204 as const, body: responseBody }
	}

	@UseGuards(JwtAuthGuard)
	@TsRest(c.deleteChan)
	async deleteChan(@Req()req: any, @TsRestRequest(){ params: { chanId } }: RequestShapes['deleteChan'])
	{
		await this.chansService.deleteChan(req.user.username, chanId)
		return { status: 202 as const, body: null }
	}

	@UseGuards(JwtAuthGuard)
	@TsRest(c.createChanMessage)
	async createChanMessage(@Req()req: any, @TsRestRequest(){ params: { chanId }, body: requestBody }: RequestShapes['createChanMessage'])
	{
		const responseBody = await this.chansService.createChanMessageIfRightTo(req.user.username, chanId, requestBody)
		if (!responseBody.message)
			throw new InternalServerErrorException('')
		return { status: 201 as const, body: await this.chansService.formatChanMessage(responseBody) }
	}

	@UseGuards(JwtAuthGuard)
	@TsRest(c.getChanMessages)
	async getChanMessages(@Req()req: any, @TsRestRequest(){ params: { chanId }, query: { nMessages, cursor } }: RequestShapes['getChanMessages'])
	{
		const body = await this.chansService.getChanMessages(req.user.username, chanId, nMessages, cursor)
		return { status: 200 as const, body: await Promise.all(body.map(el => this.chansService.formatChanMessage(el))) }
	}

	@UseGuards(JwtAuthGuard)
	@TsRest(c.deleteChanMessage)
	async deleteChanMessage(@Req()req: any, @TsRestRequest(){ params: { chanId, messageId } }: RequestShapes['deleteChanMessage'])
	{
		const body = await this.chansService.deleteChanMessage(req.user.username, chanId, messageId)
		return { status: 202 as const, body: null }
	}

	@UseGuards(JwtAuthGuard)
	@TsRest(c.kickUserFromChan)
	async kickUserFromChan(@Req()req: any, @TsRestRequest(){ params: { chanId, username } }: RequestShapes['kickUserFromChan'])
	{
		const body = await this.chansService.kickUserFromChan(req.user.username, username, chanId) 
		return { status: 202 as const, body: null }
	}
}
