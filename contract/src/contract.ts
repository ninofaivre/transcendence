import { initContract } from "@ts-rest/core"
import { type ChanEvent, chansContract } from "./routers/chans"
import { type InvitationEvent, invitationsContract } from "./routers/invitations"
import { type DmEvent, dmsContract } from "./routers/dms"
import { type FriendEvent, friendsContract } from "./routers/friends"
import { UserEvent, usersContract } from "./routers/users"
import type { MessageEvent } from "@nestjs/common"
import { authContract } from "./routers/auth"

const c = initContract()

export const contract = c.router(
	{
	    chans: chansContract,
		invitations: invitationsContract,
		dms: dmsContract,
		friends: friendsContract,
		users: usersContract,
		auth: authContract,
	},
	{
		pathPrefix: "/api",
	},
)

type TransformUnion<T> = T extends { type: infer U, data: infer D }
    ? U extends any
        ? { type: U, data: D }
        : never
    : never;

export type SseEvent = TransformUnion<InvitationEvent | DmEvent | FriendEvent | ChanEvent | UserEvent>

export type GetData<T extends SseEvent['type']> = Extract<SseEvent, { type: T }>['data']

// Dummy function to raise error at contract compilation instead
// of raising it in backend. There is probably a cleaner way...
;(T: SseEvent) => T satisfies MessageEvent
