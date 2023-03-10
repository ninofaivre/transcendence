import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class ChatService
{
	constructor(private readonly prisma: PrismaService) { }

	async getAllDiscussions(username: string)
	{
		let res: any[] = []
		for (let currDiscussion of (await this.prisma.user.findUnique({ where: { name: username } }).discussions({ include: { users: true }})))
		{
			let userNames: string[] = []
			for (let currUser of currDiscussion.users)
				userNames.push(currUser.name)
			const { users, ...newDiscussion } = currDiscussion
			newDiscussion["users"] = userNames
			res.push(newDiscussion)
		}
		return res
	}

}
