import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service'
import { UsersService } from '../users/users.service'
import { CreateMessageDTO } from './dto/createMessage.dto';
import { GetnMessagesQueryDTO } from './dto/getnMessages.query.dto';

@Injectable()
export class MessagesService
{
	constructor(private readonly prisma: PrismaService,
				private usersService: UsersService) {}

	async getnMessages(discussionId: number, getnMessagesQueryDTO: GetnMessagesQueryDTO)// need to add pagination
	{
		// en théorie il faudrait ici vérifier que l'user qui fait la requête fait bien partie des users de la discussion
		//console.log(`On m'a demandé ${n} messages à partir de ${start}`)
		const messages = await this.prisma.discussion.findUnique({ where: { id: discussionId } }).messages({ orderBy: { id: 'desc' } })
		return messages.slice(getnMessagesQueryDTO.start, getnMessagesQueryDTO.start + getnMessagesQueryDTO.n).reverse()
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
