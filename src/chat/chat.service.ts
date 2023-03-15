import { Injectable, MessageEvent } from '@nestjs/common';
import { Subject } from 'rxjs';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class ChatService
{
	constructor(private readonly prisma: PrismaService) { }

	private eventSource = new Map<String, Subject<MessageEvent>>()

	addSubject(username: string) {
		this.eventSource.set(username, new Subject<MessageEvent>)
	}

	async pushEvent(username: string, event: MessageEvent) {
		this.eventSource.get(username)?.next(event)
	}

	sendObservable(username: string) {
		return this.eventSource.get(username).asObservable()
	}

	deleteSubject(username: string) {
		console.log("close /users/sse for", username)
		this.eventSource.delete(username)
	}

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
