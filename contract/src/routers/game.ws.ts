import { z } from "zod"
import { zUserName } from "../zod/user.zod"

export const InGameMessageSchema = z.string().nonempty().max(150)
export type InGameMessage = z.infer<typeof InGameMessageSchema>

export const GameMovementSchema = z.enum(["UP", "DOWN", "NONE"])
export type GameMovement = z.infer<typeof GameMovementSchema>

export const ScoreSchema = z.number().positive().int()
export type Score = z.infer<typeof ScoreSchema>

// use timeout only to show a cooldown to the user
export const GameStatusSchema = z.discriminatedUnion("status", [
    z.strictObject({
        // INIT = décompte au début de la partie
        status: z.literal("INIT"),
        timeout: z.number().positive().int(),
        paddleLeftUserName: zUserName,
        paddleRightUserName: zUserName,
        paddleLeftScore: ScoreSchema,
        paddleRightScore: ScoreSchema
    }),
    z.strictObject({
        // INIT = décompte au début de la partie
        status: z.literal("RECONNECT"),
        paddleLeftUserName: zUserName,
        paddleRightUserName: zUserName,
        paddleLeftScore: ScoreSchema,
        paddleRightScore: ScoreSchema
    }),
    z.strictObject({
        // BREAK = décompte entre les manches
        status: z.literal("BREAK"),
        timeout: z.number().positive().int(),
        paddleLeftScore: ScoreSchema,
        paddleRightScore: ScoreSchema
    }),
    z.strictObject({
        status: z.literal("PAUSE"),
        timeout: z.number().positive().int(),
        username: zUserName
    }),
    z.strictObject({
        status: z.literal("PLAY"),
        paddleLeftScore: ScoreSchema,
        paddleRightScore: ScoreSchema
    }),
    z.strictObject({
        status: z.literal("END"),
        winner: zUserName,
        paddleLeftScore: ScoreSchema,
        paddleRightScore: ScoreSchema
    }),
    z.strictObject({
        status: z.literal("QUEUE")
    }),
    z.strictObject({
        status: z.literal("IDLE")
    })
])
export type GameStatus = z.infer<typeof GameStatusSchema>

export const PositionSchema = z.strictObject({
    x: z.number().positive().int(),
    y: z.number().positive().int()
})
export type Position = z.infer<typeof PositionSchema>

export const GamePositionsSchema = z.strictObject({
    paddleLeft: PositionSchema,
    paddleRight: PositionSchema,
    ball: PositionSchema
})
export type GamePositions = z.infer<typeof GamePositionsSchema>

export const InvitationSchema = z.strictObject({
    intraUserName: zUserName
})
export type Invitation = z.infer<typeof InvitationSchema>

export const InvitationClientResponseSchema = z.enum(["accepted", "refused"])
export type InvitationClientResponse = z.infer<typeof InvitationClientResponseSchema>

export const timeReplyToInvitation = 5

export type InvitationServerResponse =
    | {
        status: 'accepted' | 'refused' | 'timedOut'
    }
    | {
        status: 'error',
        reason: 'selfInvitation' | 'invitingNotAvailable'
    }

export interface ClientToServerEvents {
    queue: (e: "") => void
    deQueue: (e: "") => void
    surrend: (e: "") => void
    newInGameMessage: (e: InGameMessage) => void
    gameMovement: (e: GameMovement) => void
    invite: (e: Invitation, callback: (e: InvitationServerResponse) => void) => void,
    getGameStatus: (e: "", callback: (e: GameStatus['status']) => void) => void
}

export interface ServerToClientEvents {
    newInGameMessage: (e: {
        player: z.infer<typeof zUserName>
        message: InGameMessage
    }) => void,
    updatedGameStatus: (e: GameStatus) => void,
    updatedGamePositions: (e: GamePositions) => void,
    invited: (e: { username: string }, callback: (e: InvitationClientResponse) => void) => void
}
