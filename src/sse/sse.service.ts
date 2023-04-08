import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import { MessageEvent } from '@nestjs/common';

@Injectable()
export class SseService
{
	eventSource = new Map<String, Subject<MessageEvent>>()

	addSubject(username: string)
	{
		this.eventSource.set(username, new Subject<MessageEvent>())
		console.log(`this.eventSource.get(${username})`, this.eventSource.get(username))
	}

	async pushEvent(username: string, event: MessageEvent)
	{
		console.log("push Event to", username, "event:", event)
		console.log(`this.eventSource.get(${username})`, this.eventSource.get(username))
		this.eventSource.get(username)?.next(event as MessageEvent)
	}

	async pushEventMultipleUser(usernames: string[], event: MessageEvent)
	{
		return Promise.all(usernames.map(async el => this.pushEvent(el, event)))
	}

	sendObservable(username: string)
	{
		return this.eventSource.get(username).asObservable()
	}

	deleteSubject(username: string)
	{
		console.log("close /sse for", username)
		this.eventSource.delete(username)
	}
}
