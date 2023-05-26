import { AppRouter, isAppRoute } from "@ts-rest/core"
import { join } from "path"

export function prefix<T extends AppRouter>(contract: T, pre: string)
{
	pre = `/${pre}`
	for (const v of Object.values(contract))
	{
		if (isAppRoute(v))
			v.path = join(pre, v.path)
		else
			prefix(v, pre)
	}
	return contract
}


