import { Body, Get, Post, UseGuards, ValidationPipe, Sse, MessageEvent, Delete, Param, Query, Res, Next, NotImplementedException } from '@nestjs/common';
import { Controller, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { UserService } from './user.service'
import { ApiBody, ApiParam, ApiProperty, ApiResponseProperty, ApiTags } from '@nestjs/swagger';
import { ChatService } from 'src/chat/chat.service';
import { CreateUserDTO } from './dto/createUser.dto';
import { CreateChanDTO } from './dto/test.dto';

@ApiTags('user')
@Controller('user')
export class UserController
{
	constructor(private userService: UserService,
			    private chatService: ChatService) {}

	@UseGuards(JwtAuthGuard)
	@Get('/myName')
	async myName(@Request() req: any)
	{
		return { data : req.user.username }
	}

	@Post('/sign-up')
	async createUser(@Body()user: CreateUserDTO)
	{
		console.log(user)
			return this.userService.createUser(user)
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
