import { AppRouter, isAppRoute } from "@ts-rest/core"

export function prefix<T extends AppRouter>(contract: T, pre: string)
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


