import { EventEmitter2 } from "@nestjs/event-emitter"
import { EnrichedRequest } from "src/types"

export interface InternalEvents {
    'game.end': {
        id: string,
        playerA: EnrichedRequest['user'],
        playerB: EnrichedRequest['user']
    }
}

export function emitInternalEvent<Key extends keyof InternalEvents>(eventEmitter: EventEmitter2, key: Key, data: InternalEvents[typeof key]) {
    eventEmitter.emit(key, data)
}
