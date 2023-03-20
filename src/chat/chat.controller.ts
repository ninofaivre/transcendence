import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Request, Sse, UseGuards, ValidationPipe, MessageEvent, Next } from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { finalize, Observable } from 'rxjs';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { LeaveDiscussionDTO } from 'src/users/dto/leaveDiscussion.dto';
import { OneUsernameDTO } from 'src/users/dto/oneUsername.dto';
import { ChatService } from './chat.service';
import { DiscussionsService } from './discussions.service';
import { CreateChanDTO } from './dto/createChan.dto';
import { CreateDirectMessageDTO } from './dto/createDirectMessage.dto';
import { CreateDiscussionTypePathDTO } from './dto/createDiscussionType.path.dto';
import { CreateMessageDTO } from './dto/createMessage.dto';
import { GetChansPathDTO } from './dto/getChans.path.dto';
import { GetDiscussionsPathDTO } from './dto/getDiscussions.path.dto';
import { GetnMessagesQueryDTO } from './dto/getnMessages.query.dto';
import { MessagesService } from './messages.service';

@ApiTags('chat')
@Controller('chat')
export class ChatController
{
	constructor(private readonly chatService: ChatService,
			    private readonly discussionsService: DiscussionsService,
			    private readonly messagesService: MessagesService) {}

	@UseGuards(JwtAuthGuard)
	@Get('/discussions/:discussionType/')
	async getDiscussions(@Request() req: any, @Param(ValidationPipe)getDiscussionsPathDTO: GetDiscussionsPathDTO)
	{
		return this.chatService.getDiscussions(req.user.username, getDiscussionsPathDTO.discussionType)
	}
	
	@UseGuards(JwtAuthGuard)
	@Get('/discussions/CHAN/:chanType/')
	async getChans(@Request() req: any, @Param(ValidationPipe)getChansPathDTO: GetChansPathDTO)
	{
		return this.chatService.getChans(req.user.username, getChansPathDTO.chanType)
	}

	// @UseGuards(JwtAuthGuard)
	// @Get('/discussions/:type/:id')
	// async getDiscussionById(@Request() req: any, @Param(ValidationPipe)dto: GetDiscussionByIdPathDTO)
	// {
	// 	return this.chatService.getDiscussionById(req.user.username, dto.type, dto.id)
	// }
	//
	// @UseGuards(JwtAuthGuard)
	// @Post('/discussions/DM')
	// async createDirectMessage(@Request() req: any, @Body(ValidationPipe)dto: CreateDirectMessageDTO)
 //   	{
	// 	return this.chatService.createDm(req.user.username, dto.username)
	// }
	//
	// @UseGuards(JwtAuthGuard)
	// @Post('/discussions/CHAN')
	// async createChan(@Request() req: any, @Body(ValidationPipe)dto: CreateChanDTO)
 //   	{
	// 	return this.chatService.createChan(req.user.username, dto)
	// }

	/*
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
	*/

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
