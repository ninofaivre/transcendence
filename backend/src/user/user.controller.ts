import {
	UseGuards,
} from "@nestjs/common"
import { Controller, Request } from "@nestjs/common"
import { JwtAuthGuard } from "../auth/jwt-auth.guard"
import { UserService } from "./user.service"
import {
	NestControllerInterface,
	NestRequestShapes,
	TsRest,
	TsRestRequest,
	nestControllerContract,
} from "@ts-rest/nest"
import { contract } from "contract"
import { EnrichedRequest } from "src/auth/auth.service"

const c = nestControllerContract(contract.users)
type RequestShapes = NestRequestShapes<typeof c>

@TsRest({jsonQuery: true})
@Controller()
export class UserController implements NestControllerInterface<typeof c> {
	constructor(private userService: UserService) {}

    @UseGuards(JwtAuthGuard)
    @TsRest(c.searchUsers)
    async searchUsers(@Request() req: EnrichedRequest, @TsRestRequest(){ query: { nResult, userNameContains } }: RequestShapes["searchUsers"]) {
        const body = await this.userService.searchUsers(req.user.username, userNameContains, nResult)
        return { status: 200 as const, body }
    }

    @UseGuards(JwtAuthGuard)
	@TsRest(c.getMe)
	async getMe(@Request() req: EnrichedRequest) {
        console.log("getMe")
		const body = await this.userService.getMe(req.user.username)
		return { status: 200 as const, body }
	}

    @UseGuards(JwtAuthGuard)
    @TsRest(c.getUser)
    async getUser(@Request() req: EnrichedRequest, @TsRestRequest(){ params: { userName } }: RequestShapes['getUser']) {
        console.log("getUser")
        const body = await this.userService.getUser(req.user.username, userName)
        return { status: 200 as const, body }
    }

    @UseGuards(JwtAuthGuard)
    @TsRest(c.updateMe)
    async updateMe(@Request()req: EnrichedRequest, @TsRestRequest(){ body: requestBody }: RequestShapes['updateMe']) {
        const body = await this.userService.updateMe(req.user.username, requestBody)
        return { status: 200 as const, body }
    }

	@TsRest(c.signUp)
	async signUp(@TsRestRequest() { body: requestBody }: RequestShapes["signUp"]) {
		const responseBody = await this.userService.createUser(requestBody)
		return { status: 201 as const, body: responseBody }
	}

	// @Post('/test')
	// async test(@Body()test: CreateChanDTO)
	// {
	// 	console.log(test)
	// }

	// @UseGuards(JwtAuthGuard)
	// @Get('/blockedUsers')
	// async getBlockedUsers(@Request()req: any, @Query(ValidationPipe)dto: GetBlockedListQueryDTO)
	// {
	// 	return this.userService.getBlockedUsers(req.user.username, dto.filter)
	// }
	//
	// @UseGuards(JwtAuthGuard)
	// @Post('/blockedUsers')
	// async blockUser(@Request()req: any, @Body(ValidationPipe)oneUsernameDTO: OneUsernameDTO)
	// {
	// 	return this.userService.blockUser(req.user.username, oneUsernameDTO.username)
	// }
	//
	// @UseGuards(JwtAuthGuard)
	// @Delete('/blockedUsers/:username')
	// async deleteBlocked(@Request()req: any, @Param(ValidationPipe)oneUsernameDTO: OneUsernameDTO)
	// {
	// 	return this.userService.deleteBlocked(req.user.username, oneUsernameDTO.username)
	// }
	//
	// @ApiTags('chat')
	// @UseGuards(JwtAuthGuard)
	// @Delete('/discussions/:discussionId')
	// async leaveDiscussion(@Request()req: any, @Param(ValidationPipe)dto: DiscussionIdPathDTO)
	// {
	// 	throw new NotImplementedException('working on')
	// 	return this.chatService.removeUserFromDiscussionById(req.user.username, req.user.username, dto.discussionId)
	// }
	//
}
