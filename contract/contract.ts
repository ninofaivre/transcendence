import { AppRoute, AppRouter, initContract, isAppRoute } from "@ts-rest/core"
import { chansContract } from "./routers/chans"
import { invitationsContract } from "./routers/invitations"
import { dmsContract } from "./routers/dms"
import { friendsContract } from "./routers/friends"
import { usersContract } from "./routers/users"

const c = initContract()

function prefix(contract: AppRouter, pre: string): AppRouter
{
	if (!pre.length)
		return contract
	if (isAppRoute(contract))
		return contract
	for (const k in contract)
	{
		let v = contract[k]
		if (isAppRoute(v))
		{
			pre = (pre.startsWith('/') ? '' : '/') + pre
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

// prefix(chansContract, '/chans')
prefix(invitationsContract, '/invitations')
prefix(dmsContract, '/dms')
prefix(friendsContract, '/friends')
prefix(usersContract, '/users')

const contract = c.router
({
	chans: prefix(chansContract, '/chans'),
	invitations: invitationsContract,
	dms: dmsContract,
	friends: friendsContract,
	users: usersContract
})

// prefix(contract, '/api')

export default contract
