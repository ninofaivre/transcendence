import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Request, Sse, UseGuards, ValidationPipe, MessageEvent } from '@nestjs/common';
import { ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { finalize, Observable } from 'rxjs';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { LeaveDiscussionDTO } from 'src/users/dto/leaveDiscussion.dto';
import { ChatService } from './chat.service';
import { DiscussionsService } from './discussions.service';
import { CreateDiscussionDTO } from './dto/createDiscussion.dto';
import { CreateMessageDTO } from './dto/createMessage.dto';
import { GetnMessagesQueryDTO } from './dto/getnMessages.query.dto';
import { MessagesService } from './messages.service';

@Controller('chat')
export class ChatController
{
	constructor(private readonly chatService: ChatService,
			    private readonly discussionsService: DiscussionsService,
			    private readonly messagesService: MessagesService) {}

	@UseGuards(JwtAuthGuard)
	@Get('/getAllDiscussions')
	async getAllDiscussions(@Request() req: any)
	{
		return this.chatService.getAllDiscussions(req.user.username)
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
	@Post('/createMessage')
	async createMessage(@Request() req: any, @Body(ValidationPipe)createMessageDTO: CreateMessageDTO)
	{
		return this.messagesService.createMessage(req.user.username, createMessageDTO)
	}

	@UseGuards(JwtAuthGuard)
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
	@Sse('/sse')
	sse(@Request()req: any): Observable<MessageEvent>
	{
		console.log("open /chat/sse for", req.user.username)
		this.chatService.addSubject(req.user.username)
		return this.chatService.sendObservable(req.user.username)
			.pipe(finalize(() => this.chatService.deleteSubject(req.user.username)))
	}
}
