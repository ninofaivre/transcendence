import { z } from "zod"
import { zUserName } from "../zod/user.zod"

export const InGameMessageSchema = z.string().nonempty().max(150)
export type InGameMessage = z.infer<typeof InGameMessageSchema>

export interface ClientToServerEvents {
    queue: (e: "") => void
    deQueue: (e: "") => void
    newInGameMessage: (e: InGameMessage) => void
}

export interface ServerToClientEvents {
    newInGameMessage: (e: {
        player: z.infer<typeof zUserName>,
        message: InGameMessage
    }) => void
}
