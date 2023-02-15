import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service'
import { UsersService } from '../users/users.service'

@Injectable()
export class MessagesService
{
	constructor(private readonly prisma: PrismaService,
				private usersService: UsersService) {}

	async getnMessages(discussionId: number, start: number, n: number) // need to add pagination
	{
		// en théorie il faudrait ici vérifier que l'user qui fait la requête fait bien partie des users de la discussion
		//console.log(`On m'a demandé ${n} messages à partir de ${start}`)
		const messages = await this.prisma.discussion.findUnique({ where: { id: discussionId } }).messages({ orderBy: { id: 'desc' } })
		return messages.slice(start, start + n).reverse()
	}

	// need to check if users is in discussion first
	async createMessage(discussionId: number, username: string, content: string)
	{
		const res = await this.prisma.message.create({ data: { from: username, content: content, discussionId: discussionId } })
		for (let user of (await this.prisma.discussion.findUnique({ where: { id: discussionId } }).users()))
			this.usersService.updateTest[user.name]["messages"].push(res)
		return res
	}
}
