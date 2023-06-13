import { Injectable } from "@nestjs/common"
import { Subject } from "rxjs"
import { MessageEvent } from "@nestjs/common"
import { SseEvent } from "contract"

@Injectable()
export class SseService {

	private eventSource = new Map<string, Subject<MessageEvent>>()

	addSubject(username: string) {
		let tmp = this.eventSource.get(username)
		if (!tmp) {
			console.log(`creating subject for ${username}`)
			tmp = this.eventSource.set(username, new Subject<MessageEvent>()).get(username)
		}
		console.log(`open SSE for ${username}`)
		return tmp
	}

	public async pushEvent(username: string, event: SseEvent) {
		// console.log("push Event to", username, "event:", event)
		// console.log(`this.eventSource.get(${username})`, this.eventSource.get(username))
		this.eventSource.get(username)?.next(event)
	}

	public async pushEventMultipleUser(usernames: string[], event: SseEvent) {
		return Promise.all(usernames.map(async (el) => this.pushEvent(el, event)))
	}

	deleteSubject(username: string) {
		const tmp = this.eventSource.get(username)
		if (!tmp) return
		console.log("close SSE for", username)
		if (!tmp.observed) {
			this.eventSource.delete(username)
			console.log(`deleting subject for ${username}`)
		}
	}

    public isUserOnline(username: string) {
        return this.eventSource.has(username)
    }

}
