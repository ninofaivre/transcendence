import { initContract } from "@ts-rest/core"
import { z } from "zod"

const c = initContract()

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
