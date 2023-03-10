import { Body, Get, Post, UseGuards, ValidationPipe, Param, Sse, MessageEvent, Query, ParseIntPipe } from '@nestjs/common';
import { Controller, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { UsersService } from './users.service'
import { DiscussionsService } from '../discussions/discussions.service'
import { MessagesService } from '../messages/messages.service'
import { CreateUserDTO } from './dto/createUser.dto'
import { CreateDiscussionDTO } from '../discussions/dto/createDiscussion.dto'
import { LeaveDiscussionDTO } from './dto/leaveDiscussion.dto'
import { ApiBearerAuth, ApiOkResponse, ApiParam, ApiProperty, ApiResponse } from '@nestjs/swagger'
import { Observable, interval, map } from 'rxjs'
import { TestParamsQueryDTO } from './dto/testParams.query.dto';
import { UsernameListDTO } from './dto/usernameList.dto';
import { CreateMessageDTO } from 'src/messages/dto/createMessage.dto';
import { GetnMessagesQueryDTO } from 'src/messages/dto/getnMessages.query.dto';

@Controller('users')
export class UsersController
{
	constructor(private usersService: UsersService,
				private discussionsService: DiscussionsService,
				private messagesService: MessagesService) {}

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Get('/myName')
	async myName(@Request() req: any)
	{
		return { data : req.user.username }
	}

	@Post('/sign-up')
	async createUser(@Body(ValidationPipe)user : CreateUserDTO)
	{
		return this.usersService.createUser(user)
	}

	// @UseGuards(JwtAuthGuard)
	// @Post('/testDto')
	// async testDto(@Body(ValidationPipe)usernameListDTO: UsernameListDTO)
	// {
	// 	console.log(usernameListDTO)
	// }

	// @UseGuards(JwtAuthGuard)
	// @Get('/testParams/:id/:name')
	// async testParams(@Query()testParamsQueryDTO: TestParamsQueryDTO)
	// {
	// 	console.log(testParamsQueryDTO)
	// }

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Get('/getAllDiscussions')
	async getAllDiscussions(@Request() req: any)
	{
		return this.usersService.getAllDiscussions(req.user.username)
	}

	@UseGuards(JwtAuthGuard)
	@Post('/createDiscussion')
	async createDiscussion(@Request() req: any, @Body(ValidationPipe)createDiscussionDTO: CreateDiscussionDTO)
	{
		return this.discussionsService.createDiscussion(req.user.username, createDiscussionDTO)
	}

	@UseGuards(JwtAuthGuard)
	@Post('/leaveDiscussion')
	async leaveDiscussion(@Request() req: any, @Body(ValidationPipe)leaveDiscussionDTO: LeaveDiscussionDTO)
	{
		this.discussionsService.removeOneUserFromDiscussion(req.user.username, leaveDiscussionDTO.discussionID)
	}

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Post('/createMessage')
	async createMessage(@Request() req: any, @Body(ValidationPipe)createMessageDTO: CreateMessageDTO)
	{
		return this.messagesService.createMessage(req.user.username, createMessageDTO)
	}

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@ApiParam({
		name: 'discussionId',
		type: 'integer',
	})
	@Get('/getnMessages/:discussionId/')
	async getnMessages(@Request() req: any, 
					   @Param('discussionId', ParseIntPipe)discussionId: number,
					   @Query(ValidationPipe)getnMessagesQueryDTO: GetnMessagesQueryDTO)
	{
		return this.messagesService.getnMessages(req.user.username, discussionId, getnMessagesQueryDTO)
	}

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Sse('/sse')
	getUpdate(@Request() req: any): Observable<MessageEvent> 
	{
		this.usersService.updateTest[req.user.username] = { discussions: [], messages: [] }
		return interval(1000).pipe(map((_) => ({ data: this.usersService.getUpdate(req.user.username) })))
	}
}
