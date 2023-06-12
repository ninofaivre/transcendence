import { initContract } from "@ts-rest/core"
import { type ChanEvent, chansContract } from "./routers/chans"
import { type InvitationEvent, invitationsContract } from "./routers/invitations"
import { type DmEvent, dmsContract } from "./routers/dms"
import { type FriendEvent, friendsContract } from "./routers/friends"
import { usersContract } from "./routers/users"
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

export type SseEvent = InvitationEvent | DmEvent | FriendEvent | ChanEvent

// Dummy function to raise error directyl in contract if SseEvent does not satisfies MessageEvent
// instead of raising it in backend. There is probably a cleaner way...
;(T: SseEvent) => T satisfies MessageEvent

// export const client = initClient(contract, {
//   baseUrl: 'http://localhost:3334',
//   baseHeaders: {},
// });
