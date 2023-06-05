import { Body, Controller, Delete, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { FriendsService } from './friends.service';
import { NestControllerInterface, NestRequestShapes, TsRest, TsRestRequest, nestControllerContract } from '@ts-rest/nest';
import contract from 'contract/contract';

const c = nestControllerContract(contract.friends)
type RequestShapes = NestRequestShapes<typeof c>

@Controller()
export class FriendsController implements NestControllerInterface<typeof c>
{

	constructor(private readonly friendsService: FriendsService) {}


	// @UseGuards(JwtAuthGuard)
	// @TsRest(c.getFriends)
	// async getFriends(@Request()req: any)
	// {
	// 	const body = await this.friendsService.getFriends(req.user.username)
	// 	return { status: 200 as const, body: body }
	// }
	//
	@UseGuards(JwtAuthGuard)
	@TsRest(c.deleteFriend)
	async deleteFriend(@Request()req: any, @TsRestRequest(){ params: { friendShipId } }: RequestShapes['deleteFriend'])
	{
		await this.friendsService.deleteFriend(req.user.username, friendShipId)
		return { status: 202 as const, body: null }
	}
}
