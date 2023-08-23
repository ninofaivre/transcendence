import { initContract } from "@ts-rest/core"
import { z } from "zod"

const c = initContract()

// TODO maybe merge all of that in one Game object ? idk. Could be called GameProperty ?

export const GameDim = {
    court: { width: 1600, height: 900 },
    paddle: { width: 25, height: 225 },
    ballRadius: 25 
}

export const GameTimings = {
    userPauseAmount: 60 * 1000,
    breakTimeout: 3 * 1000,
    initTimeout: 5 * 1000
}

// in unit by second
export const GameSpeed = {
    paddle: 450,
    ball: 600 // will be a base speed (speed of ball will change over time) random value for now
}

export const zGameParameters = z.strictObject({
	court: z.strictObject({
		start: z.strictObject({
			x: z.number(),
			y: z.number(),
		}),
		size: z.strictObject({
			width: z.number(),
			height: z.number(),
		}),
	}),
	ball: z.strictObject({
		start: z.strictObject({
			x: z.number(),
			y: z.number(),
		}),
		// Radius
		size: z.number(),
	}),
	paddle: z.strictObject({
		start: z.strictObject({
			x: z.number(),
			y: z.number(),
		}),
		size: z.strictObject({
			width: z.number(),
			height: z.number(),
		}),
	}),
})

export const gameContract = c.router(
	{
		// Valid for all games ? Or should I send an id of a game that was created beforehand ?
		getGameParameters: {
			method: "GET",
			path: "/",
			// path: "/:id",
			// pathParams: z.strictObject({
			// 	gameId: z.string().uuid(),
			// }),
			responses: {
				200: zGameParameters,
			},
		},
	},
	{
		pathPrefix: "/game",
	},
)
