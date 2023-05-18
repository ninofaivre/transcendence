import type { ClientInferResponseBody } from "@ts-rest/core"

import type { chansContract } from "$contracts/chans"
import type { dmsContract } from "$contracts/dms"
import type { friendsContract } from "$contracts/friends"
import type { usersContract } from "$contracts/users"

export type Discussion = ClientInferResponseBody<typeof chansContract.getMyChans, 200>
export type Chan = Discussion
export type ChanMessage = ClientInferResponseBody<typeof chansContract.getChanMessages, 200>
export type DirectMessage = ClientInferResponseBody<typeof dmsContract.getDms, 200>
