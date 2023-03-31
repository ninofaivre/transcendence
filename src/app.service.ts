import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import { MessageEvent } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class AppService
{
	public discussionEventsSelect = Prisma.validator<Prisma.DiscussionEventSelect>()
	({
		eventType: true,
		concernedUser: true,
	})

	public discussionMessagesSelect = Prisma.validator<Prisma.DiscussionMessageSelect>()
	({
		content: true,
		relatedId: true,
	})

	public discussionElementsSelect = Prisma.validator<Prisma.DiscussionElementSelect>()
	({
		id: true,
		event: { select: this.discussionEventsSelect },
		message: { select: this.discussionMessagesSelect },
		author: true,
		creationDate: true
	})


	private eventSource = new Map<String, Subject<MessageEvent>>()

	public addSubject(username: string)
	{
		this.eventSource.set(username, new Subject<MessageEvent>)
	}

	public async pushEvent(username: string, event: MessageEvent)
	{
		this.eventSource.get(username)?.next(event)
	}

	public async pushEventMultipleUser(usernames: string[], event: MessageEvent)
	{
		usernames.forEach(el => this.eventSource.get(el)?.next(event))
	}

	public sendObservable(username: string) {
		return this.eventSource.get(username).asObservable()
	}

	public deleteSubject(username: string)
	{
		console.log("close /sse for", username)
		this.eventSource.delete(username)
	}
}
