import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import { MessageEvent } from '@nestjs/common';

@Injectable()
export class SseService
{
	eventSource = new Map<String, Subject<MessageEvent>>()

	addSubject(username: string)
	{
		if (!this.eventSource.get(username))
			this.eventSource.set(username, new Subject<MessageEvent>())
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

export enum EventTypeList
{
	// dms
	NEW_DM = 'NEW_DM',
	DM_DELETED = "DM_DELETED",
	DM_NEW_EVENT = "DM_NEW_EVENT",
	DM_NEW_MESSAGE = "DM_NEW_MESSAGE",

	// invitations
	NEW_FRIEND_INVITATION = "NEW_FRIEND_INVITATION",
	FRIEND_INVITATION_REFUSED = "FRIEND_INVITATION_REFUSED",
	FRIEND_INVITATION_CANCELED = "FRIEND_INVITATION_CANCELED",
	CHAN_NEW_INVITATION = "CHAN_NEW_INVITATION",
	CHAN_INVITATION_CANCELED = "CHAN_INVITATION_CANCELED",
	CHAN_INVITATION_REFUSED = "CHAN_INVITATION_REFUSED",
}
