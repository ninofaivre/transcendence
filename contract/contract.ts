import { AppRouter, initContract, isAppRoute } from "@ts-rest/core"
import { chansContract } from "./routers/chans"
import { invitationsContract } from "./routers/invitations"
import { dmsContract } from "./routers/dms"
import { friendsContract } from "./routers/friends"
import { usersContract } from "./routers/users"

const c = initContract()

function prefix<T extends AppRouter>(contract: T, pre: string)
{
	pre = pre.replace(/^\//, '').replace(/\/$/, '')
	if (pre === "")
		return contract
	for (const k in contract)
	{
		let v = contract[k]
		if (isAppRoute(v))
			v.path = `/${pre}/${v.path.replace(/^\//, '')}`
		else
			prefix(v, pre)
	}
	return contract
}

const contract = prefix(c.router
({
	chans: prefix(chansContract, '/chans'),
	invitations: prefix(invitationsContract, '/invitations'),
	dms: prefix(dmsContract, '/dms'),
	friends: prefix(friendsContract, '/friends'),
	users: prefix(usersContract, '/users')
}), '/api')

export default contract
