import { initContract } from "@ts-rest/core"
import { chansContract } from "./routers/chans"
import { InvitationEvent, invitationsContract } from "./routers/invitations"
import { DmEvent, dmsContract } from "./routers/dms"
import { FriendEvent, friendsContract } from "./routers/friends"
import { usersContract } from "./routers/users"
import { prefix } from "./lib/prefix"

const c = initContract()

const contract = prefix(c.router
({
	chans: prefix(chansContract, '/chans'),
	invitations: prefix(invitationsContract, '/invitations'),
	dms: prefix(dmsContract, '/dms'),
	friends: prefix(friendsContract, '/friends'),
	users: prefix(usersContract, '/users')
}), '/api')

export default contract

// find a way to ensure in the contract than the type SseEvent implement MessageEvent
// right now backend will fail to build if it doesn't but the error in not located in the contract
export type SseEvent = InvitationEvent | DmEvent | FriendEvent
