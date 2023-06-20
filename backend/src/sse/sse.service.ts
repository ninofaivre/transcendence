import { Inject, Injectable, forwardRef } from "@nestjs/common"
import { Subject } from "rxjs"
import { MessageEvent } from "@nestjs/common"
import { SseEvent } from "contract"
import { UserService } from "src/user/user.service"

@Injectable()
export class SseService {

    constructor(
        @Inject(forwardRef(() => UserService))
        private readonly usersService: UserService) {}

	private eventSource = new Map<string, Subject<MessageEvent>>()

	async addSubject(username: string) {
		let tmp = this.eventSource.get(username)
		if (!tmp) {
            await this.usersService.notifyStatus(username, "ONLINE")
			console.log(`creating subject for ${username}`)
            tmp = new Subject<MessageEvent>()
			this.eventSource.set(username, tmp)
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

	async deleteSubject(username: string) {
		const tmp = this.eventSource.get(username)
		if (!tmp) return
		console.log("close SSE for", username)
		if (!tmp.observed) {
			this.eventSource.delete(username)
			console.log(`deleting subject for ${username}`)
            await this.usersService.notifyStatus(username, "OFFLINE")
		}
	}

    public isUserOnline(username: string) {
        return this.eventSource.has(username)
    }

}
