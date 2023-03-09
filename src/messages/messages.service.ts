import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service'
import { UsersService } from '../users/users.service'
import { CreateMessageDTO } from './dto/createMessage.dto';
import { GetnMessagesQueryDTO } from './dto/getnMessages.query.dto';

@Injectable()
export class MessagesService
{
	constructor(private readonly prisma: PrismaService,
				private usersService: UsersService) {}

	async getnMessages(username, discussionId: number, getnMessagesQueryDTO: GetnMessagesQueryDTO)// need to add pagination
	{
		const res = await this.prisma.discussion.findUnique({ where: { id: discussionId }, include: { users: true, messages: { orderBy: { id: 'desc' } } } })
		if (!res)
			throw new NotFoundException("discussion not found !")
		if (!res.users.some(el => el.name === username))
			throw new UnauthorizedException("you must be in the discussion to get messages from it !")
		return res.messages.slice(getnMessagesQueryDTO.start, getnMessagesQueryDTO.start + getnMessagesQueryDTO.n).reverse()
	}

	// need to check if users is in discussion first
	async createMessage(username: string, createMessageDTO: CreateMessageDTO)
	{
		const res = await this.prisma.message.create({ data: { from: username, content: createMessageDTO.content, discussionId: createMessageDTO.discussionId } })
		for (let user of (await this.prisma.discussion.findUnique({ where: { id: createMessageDTO.discussionId } }).users()))
		{
			if (this.usersService.updateTest[user.name])
				this.usersService.updateTest[user.name]["messages"].push(res)
		}
		return res
	}
}
