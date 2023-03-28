import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import { MessageEvent } from '@nestjs/common';

@Injectable()
export class AppService
{
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
		console.log("close /sse for", username)
		this.eventSource.delete(username)
	}
}
