import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Request, Sse, UseGuards, ValidationPipe, MessageEvent, Next, Delete, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { finalize, Observable } from 'rxjs';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { LeaveDiscussionDTO } from 'src/users/dto/leaveDiscussion.dto';
import { OneUsernameDTO } from 'src/users/dto/oneUsername.dto';
import { ChatService } from './chat.service';
import { DiscussionsService } from './discussions.service';
import { CreateChanDTO } from './dto/createChan.dto';
import { CreateDirectMessageDTO } from './dto/createDirectMessage.dto';
import { CreateDiscussionDTO } from './dto/createDiscussion.dto';
import { CreateMessageDTO } from './dto/createMessage.dto';
import { DiscussionIdPathDTO } from './dto/discussionId.path.dto';
import { GetDiscussionsQueryDTO } from './dto/getDiscussions.query.dto';
import { GetnMessagesQueryDTO } from './dto/getnMessages.query.dto';
import { KickUserFromDiscussionPathDTO } from './dto/kickUserFromDiscussion.path.dto';
import { MessagesService } from './messages.service';

@ApiTags('chat')
@Controller('chat')
export class ChatController
{
	constructor(private readonly chatService: ChatService,
			    private readonly discussionsService: DiscussionsService,
			    private readonly messagesService: MessagesService) {}


	@UseGuards(JwtAuthGuard)
	@Get('/discussions')
	async getDiscussions(@Request()req: any, @Query(ValidationPipe)dto: GetDiscussionsQueryDTO)
	{
		return this.chatService.getDiscussions(req.user.username, dto.discussionFilter, dto.chanFilter)
	}

	@UseGuards(JwtAuthGuard)
	@Get('/discussions/:discussionId')
	async getDiscussionById(@Request()req: any, @Param(ValidationPipe)dto: DiscussionIdPathDTO)
	{
		return this.chatService.getDiscussionById(req.user.username, dto.discussionId)
	}

	@UseGuards(JwtAuthGuard)
	@Post('/discussions/:discussionId/users')
	async addUserToDiscussion(@Request()req: any, @Param(ValidationPipe)pathDto: DiscussionIdPathDTO, @Body(ValidationPipe)dto: OneUsernameDTO)
	{
		return this.chatService.addUserToDiscussion(req.user.username, pathDto.discussionId, dto.username)
	}

	@UseGuards(JwtAuthGuard)
	@Delete('/discussions/:discussionId/users/:username')
	async kickUserFromDiscussion(@Request()req: any, @Param()dto: KickUserFromDiscussionPathDTO)
	{
		return this.chatService.removeUserFromDiscussionById(req.user.username, dto.username, dto.discussionId)
	}

	@UseGuards(JwtAuthGuard)
	@Post('/discussions')
	async createDiscussion(@Request()req: any, @Body(ValidationPipe)dto: CreateDiscussionDTO)
	{
		if (Number(!!dto.publicChan) + Number(!!dto.privateChan) + Number(!!dto.dm) != 1)
			throw new BadRequestException("You can post only and not less than one type of discussion")
		if (dto.dm)
			return this.chatService.createDm(req.user.username, dto.dm.username)
		if (dto.publicChan)
			return this.chatService.createPublicChan(req.user.username, dto.publicChan)
		if (dto.privateChan)
			return this.chatService.createPrivateChan(req.user.username, dto.privateChan.title)
	}

	@UseGuards(JwtAuthGuard)
	@Delete('/discussions/:discussionId')
	async leaveDiscussion(@Request()req: any, @Param(ValidationPipe)dto: DiscussionIdPathDTO)
	{
		return this.chatService.removeUserFromDiscussionById(req.user.username, req.user.username, dto.discussionId)
	}

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
