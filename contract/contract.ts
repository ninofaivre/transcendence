import { initClient, initContract } from "@ts-rest/core"
import { ChanEvent, chansContract } from "./routers/chans"
import { InvitationEvent, invitationsContract } from "./routers/invitations"
import { DmEvent, dmsContract } from "./routers/dms"
import { FriendEvent, friendsContract } from "./routers/friends"
import { usersContract } from "./routers/users"
import { prefix } from "./lib/prefix"
import { MessageEvent } from "@nestjs/common"

const c = initContract()

const contract = prefix(c.router
({
	chans: prefix(chansContract, 'chans'),
	invitations: prefix(invitationsContract, 'invitations'),
	dms: prefix(dmsContract, 'dms'),
	friends: prefix(friendsContract, 'friends'),
	users: prefix(usersContract, 'users')
}), 'api')

export default contract

export type SseEvent = InvitationEvent | DmEvent | FriendEvent | ChanEvent

// Dummy function to raise error directyl in contract if SseEvent does not satisfies MessageEvent
// instead of raising it in backend. There is probably a cleaner way...
(T: SseEvent) => T satisfies MessageEvent

// export const client = initClient(contract, {
//   baseUrl: 'http://localhost:3334',
//   baseHeaders: {},
// });
