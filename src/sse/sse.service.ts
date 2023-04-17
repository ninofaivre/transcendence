import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import { MessageEvent } from '@nestjs/common';

@Injectable()
export class SseService
{
	eventSource = new Map<String, { subject: Subject<MessageEvent>, observersCount: number}>()

	addSubject(username: string)
	{
		const tmp = this.eventSource.get(username)
		if (!tmp)
			return this.eventSource.set(username, { subject: new Subject<MessageEvent>(), observersCount: 0}).get(username)
		tmp.observersCount++
		return tmp
	}

	async pushEvent(username: string, event: MessageEvent)
	{
		console.log("push Event to", username, "event:", event)
		console.log(`this.eventSource.get(${username})`, this.eventSource.get(username))
		this.eventSource.get(username)?.subject.next(event as MessageEvent)
	}

	async pushEventMultipleUser(usernames: string[], event: MessageEvent)
	{
		return Promise.all(usernames.map(async el => this.pushEvent(el, event)))
	}

	deleteSubject(username: string)
	{
		const tmp = this.eventSource.get(username)
		if (!tmp)
			return
		tmp.observersCount--
		if (tmp.observersCount > 0)
			return
		console.log("close /sse for", username)
		this.eventSource.delete(username)
	}
}

export enum EventTypeList
{
	// chans
	CHAN_DELETED = "CHAN_DELETED",
	CHAN_NEW_EVENT = "CHAN_NEW_EVENT",
	CHAN_NEW_MESSAGE = "CHAN_NEW_MESSAGE",

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

	// friends
	NEW_FRIEND = "NEW_FRIEND",
	DELETED_FRIEND = "DELETED_FRIEND"
}
