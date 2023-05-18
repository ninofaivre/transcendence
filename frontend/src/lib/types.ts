import type { ClientInferResponseBody } from "@ts-rest/core"

import type contract from "$contract"

export type Chans = ClientInferResponseBody<typeof contract.chans.getMyChans, 200>
export type ChanMessage = ClientInferResponseBody<typeof contract.chans.getChanMessages, 200>

export type Conversations = ClientInferResponseBody<typeof contract.dms.getDms, 200>
export type DirectMessage = ClientInferResponseBody<typeof contract.dms.getDms, 200>
