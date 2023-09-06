import { initContract } from "@ts-rest/core"
import { zUserName } from "../zod/user.zod"
import { z } from "zod"
import { zUserStatus } from "../zod/user.zod"

const c = initContract()

export const zFriendShipReturn = z.strictObject({
	id: z.string().uuid(),
	creationDate: z.date(),
	friendName: zUserName,
    friendDisplayName: zUserName,
	friendStatus: zUserStatus
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
			body: c.type<null>(),
			responses: {
				204: c.type<null>(),
			},
		},
	},
	{
		pathPrefix: "/friends",
	},
)

export type FriendEvent =
	| { type: "CREATED_FRIENDSHIP"; data: z.infer<typeof zFriendShipReturn> }
	| { type: "DELETED_FRIENDSHIP"; data: { friendShipId: string } }
