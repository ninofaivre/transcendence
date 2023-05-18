import { AppRouter, initContract, isAppRoute } from "@ts-rest/core"
import { chansContract } from "./routers/chans"
import { invitationsContract } from "./routers/invitations"
import { dmsContract } from "./routers/dms"
import { friendsContract } from "./routers/friends"
import { usersContract } from "./routers/users"

const c = initContract()

function prefix<T extends AppRouter>(contract: T, pre: string)
{
	if (!pre.length)
		return contract
	for (const k in contract)
	{
		let v = contract[k]
		if (isAppRoute(v)) // dirty append
		{
			if (!pre.startsWith('/'))
				pre = '/' + pre
			if (!v.path.length)
			{
				v.path = pre
				continue;
			}
			if (v.path.startsWith('/') && pre.endsWith('/'))
				v.path = v.path.substring(1)
			else if (!v.path.startsWith('/') && !pre.endsWith('/'))
				v.path = '/' + v.path
			v.path = pre + v.path
		}
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
