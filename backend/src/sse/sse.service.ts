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

	private eventSource = new Map<string, Subject<MessageEvent & { ignoreSseId?: string }>>()

	async addSubject(username: string) {
		let tmp = this.eventSource.get(username)
		if (!tmp) {
            tmp = new Subject<MessageEvent>()
			this.eventSource.set(username, tmp)
            await this.usersService.notifyStatus(username)
		}
		return tmp
	}

	public async pushEvent(username: string, event: SseEvent, ignoreSseId?: string) {
		this.eventSource.get(username)?.next({ ...event, ignoreSseId })
	}

	public async pushEventMultipleUser(usernames: string[], event: SseEvent, ignoreSse?: { username: string, sseId?: string }) {
		return Promise.all(
            usernames
                .map(async (username) => {
                    if (ignoreSse && ignoreSse.username === username)
                        return this.pushEvent(username, event, ignoreSse.sseId)
                    else
                        return this.pushEvent(username, event)
                })
        )
	}

	async deleteSubject(username: string) {
		const tmp = this.eventSource.get(username)
		if (!tmp) return
		if (!tmp.observed) {
			this.eventSource.delete(username)
            await this.usersService.notifyStatus(username)
		}
	}

    public isUserOnline(username: string) {
        return this.eventSource.has(username)
    }

}
