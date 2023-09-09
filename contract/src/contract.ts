import { initContract } from "@ts-rest/core"
import { type ChanEvent, chansContract } from "./routers/chans"
import { type InvitationEvent, invitationsContract } from "./routers/invitations"
import { type DmEvent, dmsContract } from "./routers/dms"
import { type FriendEvent, friendsContract } from "./routers/friends"
import { UserEvent, usersContract } from "./routers/users"
import type { MessageEvent } from "@nestjs/common"
import { authContract } from "./routers/auth"
import { gameContract } from "./routers/game"

export type FlattenUnionObjectByDiscriminator<
    Union,
    DiscriminatorKey extends keyof Union
> = Union extends Record<DiscriminatorKey, infer Discriminator>
    ? Discriminator extends unknown
        ? { [key in DiscriminatorKey]: Extract<Union, Record<key, unknown>> }[DiscriminatorKey]
        : never
    : never

export type SseEvent = FlattenUnionObjectByDiscriminator<
	(InvitationEvent | DmEvent | FriendEvent | ChanEvent | UserEvent), "type"
>

// Dummy function to raise error at contract compilation instead
// of raising it in backend. There is probably a cleaner way...
;(T: SseEvent) => T satisfies MessageEvent

export type GetData<T extends SseEvent["type"]> = Extract<SseEvent, { type: T }>["data"]

const c = initContract()

export const contract = c.router(
	{
		chans: chansContract,
		invitations: invitationsContract,
		dms: dmsContract,
		friends: friendsContract,
		users: usersContract,
		auth: authContract,
		game: gameContract,
	},
	{
		pathPrefix: "/api",
	},
)
