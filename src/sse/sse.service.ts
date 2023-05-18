import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import { MessageEvent } from '@nestjs/common';

@Injectable()
export class SseService
{

	eventSource = new Map<string, Subject<MessageEvent>>()

	addSubject(username: string)
	{
		let tmp = this.eventSource.get(username)
		if (!tmp)
		{
			console.log(`creating subject for ${username}`)
			tmp = this.eventSource.set(username, new Subject<MessageEvent>()).get(username)
		}
		console.log(`open SSE for ${username}`)
		return tmp
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

	deleteSubject(username: string)
	{
		const tmp = this.eventSource.get(username)
		if (!tmp)
			return
		console.log("close SSE for", username)
		if (!tmp.observed)
		{
			this.eventSource.delete(username)
			console.log(`deleting subject for ${username}`)
		}
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
