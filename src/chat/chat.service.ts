import { ConflictException, Injectable, MessageEvent } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { DiscussionType, Discussion } from '@prisma/client'
import { Subject } from 'rxjs';
import { PrismaService } from 'src/prisma.service';
import { filterType as discussionsFilterType } from './dto/getDiscussions.query.dto';

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

	async getDiscussions(username: string, filter: discussionsFilterType)
	{
		const or = []
		if (filter == discussionsFilterType['ALL'] || filter == discussionsFilterType['DM'])
			or.push({ type: DiscussionType['DIRECT_MESSAGE'] })
		if (filter == discussionsFilterType['ALL'] || filter == discussionsFilterType['CHAN'])
		{
			or.push({ type: DiscussionType['PUBLIC_CHAN'] })
			or.push({ type: DiscussionType['PRIVATE_CHAN'] })
		}

		const res = (await this.prisma.user.findUnique({ where: { name: username }, 
			select: { discussions: { where: { OR : or } }, }})).discussions

		if (filter === discussionsFilterType['DM'])
			return res
		else
		{
			return res.reduce((acc, curr: Discussion) => {
				if (!acc[curr.type])
					acc[curr.type] = []
				acc[curr.type].push(curr)
				return acc
			}, {})
		}
	}

	async createDm(myUsername: string, friendUsername: string)
	{
		const dm = !!(await this.prisma.user.findUnique({ where: { name: myUsername },
			select:
			{
				discussions:
				{
					where:
					{
						type: DiscussionType['DIRECT_MESSAGE']
					},
					select:
					{
						users:
						{
							where: { name: friendUsername },
							select: { name: true }
						}
					}
				}
			}
		})).discussions[0].users.length

		if (dm)
			throw new ConflictException(`you already have a dm with ${friendUsername}`)
		return this.prisma.discussion.create({
			data:
			{
				type: DiscussionType['DIRECT_MESSAGE'],
				users: { connect: [{name: myUsername}, {name: friendUsername}] }
			}})
	}
}
