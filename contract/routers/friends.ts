import { initContract } from "@ts-rest/core";
import { zUserName } from "contract/zod/user.zod";
import { z } from "zod";

const c = initContract()

export const zFriendShipReturn = z.strictObject
({
	id: z.string().uuid(),
	creationDate: z.date(),
	friendName: zUserName,
})

export const friendsContract = c.router
({
	// getFriends:
	// {
	// 	method: 'GET',
	// 	path: '/',
	// 	responses:
	// 	{
	// 		200: z.array(zFriendShip)
	// 	}
	// },
	// acceptFriendInvitation:
	// {
	// 	method: 'POST',
	// 	path: '/',
	// 	body: z.strictObject
	// 	({
	// 		invitationId: zFriendInvitationId
	// 	}),
	// 	responses:
	// 	{
	// 		201: zFriendShip
	// 	}
	// },
	// deleteFriend:
	// {
	// 	method: 'DELETE',
	// 	path: '/:friendShipId',
	// 	pathParams: z.strictObject
	// 	({
	// 		friendShipId: zFriendShipId
	// 	}),
	// 	body: c.body<null>(),
	// 	responses:
	// 	{
	// 		202: c.response<null>()
	// 	}
	// }
})

export type FriendEvent =
{ type: 'CREATED_FRIENDSHIP' | 'UPDATED_FRIENDSHIP', data: z.infer<typeof zFriendShipReturn> }
