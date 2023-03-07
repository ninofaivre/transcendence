import { Body, Get, Post, UseGuards, ValidationPipe, Param, Sse, MessageEvent } from '@nestjs/common';
import { Controller, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { UsersService } from './users.service'
import { DiscussionsService } from '../discussions/discussions.service'
import { MessagesService } from '../messages/messages.service'
import { CreateUserDTO } from './dto/createUser.dto'
import { CreateDiscussionDTO } from '../discussions/dto/createDiscussion.dto'
import { ApiBearerAuth } from '@nestjs/swagger'
import { Observable, interval, map } from 'rxjs'

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
	@ApiBearerAuth('JWT-auth')
	@Post('/createMessage')
	async createMessage(@Request() req: any, @Body(ValidationPipe)dto: { discussionId: number, content: string })
	{
		return this.messagesService.createMessage(dto.discussionId, req.user.username, dto.content)
	}

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Post('/getnMessages')
	async getnMessages(@Request() req: any, @Body(ValidationPipe)dto: { discussionId: number, start: number, n: number })
	{
		return this.messagesService.getnMessages(dto.discussionId, dto.start, dto.n)
	}

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Sse('/sse')
	getUpdate(@Request() req: any): Observable<MessageEvent> 
	{
		this.usersService.updateTest[req.user.username] = { discussions: [], messages: [] }
		return interval(100).pipe(map((_) => ({ data: this.usersService.getUpdate(req.user.username) })))
	}
}
