import { initContract } from "@ts-rest/core"
import { z } from "zod"
import { zUserName } from "../zod/user.zod"

const c = initContract()

// TODO maybe merge all of that in one Game object ? idk. Could be called GameProperty ?

export const GameDim = {
	court: { width: 1600, height: 900 },
	paddle: { width: 25, height: 200 },
	ballSideLength: 25, // ball is a square
}

export const GameTimings = {
	userPauseAmount: 60 * 1000,
	breakTimeout: 3 * 1000,
	initTimeout: 5 * 1000,
	initCustomGameTimeout: 60 * 1000,
}

// in unit by second
export const GameSpeed = {
	paddle: 450,
	ball: 400, // will be a base speed (speed of ball will change over time) random value for now
    ballAccelPercentage: 2
}

// export const zGameParameters = z.strictObject({
// 	court: z.strictObject({
// 		start: z.strictObject({
// 			x: z.number(),
// 			y: z.number(),
// 		}),
// 		size: z.strictObject({
// 			width: z.number(),
// 			height: z.number(),
// 		}),
// 	}),
// 	ball: z.strictObject({
// 		start: z.strictObject({
// 			x: z.number(),
// 			y: z.number(),
// 		}),
// 		// Radius
// 		size: z.number(),
// 	}),
// 	paddle: z.strictObject({
// 		start: z.strictObject({
// 			x: z.number(),
// 			y: z.number(),
// 		}),
// 		size: z.strictObject({
// 			width: z.number(),
// 			height: z.number(),
// 		}),
// 	}),
// })

const zMatch = z.strictObject({
    id: z.string().uuid(),
    creationDate: z.date(),
    win: z.boolean(),
    looserDisplayName: zUserName,
    winnerDisplayName: zUserName,
    looserScore: z.number().positive().int(),
    winnerScore: z.number().positive().int()
})

export const gameContract = c.router(
	{
		getMatchHistory: {
			method: "GET",
			path: "/:username/match-history",
			summary: "get match history",
			pathParams: z.strictObject({
				username: zUserName,
			}),
			query: z.strictObject({
				nMatches: z.number().positive().int().max(50).default(20),
				cursor: z.string().uuid().optional(),
			}),
			responses: {
				200: z.array(zMatch),
			},
		},
	},
	{
		pathPrefix: "/game",
	},
)
