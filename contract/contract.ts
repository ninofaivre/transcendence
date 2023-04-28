import { initContract } from "@ts-rest/core"
import { chansContract } from "./routers/chans"
import { invitationsContract } from "./routers/invitations"
import { dmsContract } from "./routers/dms"
import { friendsContract } from "./routers/friends"
import { usersContract } from "./routers/users"

const c = initContract()

const contract = c.router
({
	chans: chansContract,
	invitations: invitationsContract,
	dms: dmsContract,
	friends: friendsContract,
	users: usersContract
})

export default contract
