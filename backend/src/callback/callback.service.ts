import { Injectable } from '@nestjs/common';

type CallBackType = "UNMUTE" | "UNBAN"

@Injectable()
export class CallbackService {
    
    private data = new Map<string, Record<CallBackType, NodeJS.Timeout | null>>()

    getCallback = (username: string, callback: CallBackType): NodeJS.Timeout | null =>
        this.data.get(username)?.[callback] || null

    setCallback = (username: string, callback: CallBackType, id: NodeJS.Timeout) => {
        const userCallbacks = this.data.get(username) ||
            this.data.set(username, { UNMUTE: null, UNBAN: null }).get(username)
        if (!userCallbacks)
            return
        this.deleteCallback(username, callback)
        userCallbacks[callback] = id
    }

    deleteCallback = (username: string, callback: CallBackType) => {
        const userCallbacks = this.data.get(username)
        if (!userCallbacks)
            return
        const callbackToRemove = userCallbacks[callback]
        if (!callbackToRemove)
            return
        clearTimeout(callbackToRemove)
        userCallbacks[callback] = null
    }

}
