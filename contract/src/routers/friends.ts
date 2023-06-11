import { initContract } from "@ts-rest/core"
import { zUserName } from "../zod/user.zod"
import { z } from "zod"

const c = initContract()

export const zFriendShipReturn = z.strictObject({
	id: z.string().uuid(),
	creationDate: z.date(),
	friendName: zUserName,
})

export const friendsContract = c.router(
	{
		getFriends: {
			method: "GET",
			path: "/",
			responses: {
				200: z.array(zFriendShipReturn),
			},
		},
		deleteFriend: {
			method: "DELETE",
			path: "/:friendShipId",
			pathParams: z.strictObject({
				friendShipId: z.string().uuid(),
			}),
			body: c.body<null>(),
			responses: {
				202: c.response<null>(),
			},
		},
	},
	{
		pathPrefix: "/friends",
	},
)

export type FriendEvent =
	| { type: "CREATED_FRIENDSHIP" | "UPDATED_FRIENDSHIP"; data: z.infer<typeof zFriendShipReturn> }
	| { type: "DELETED_FRIENDSHIP"; data: { friendShipId: string } }