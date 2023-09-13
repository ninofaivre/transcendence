import type { LoadEvent } from "@sveltejs/kit"
import { client } from "$lib/clients"

export const load = async ({ depends }: LoadEvent) => {
	depends("app:chans:invitations")
	depends("app:friends:invitations")

	const chan_invites = await client.invitations.chan.getChanInvitations({
		query: { status: ["PENDING"] },
	})

	const friend_requests = await client.invitations.friend.getFriendInvitations({
		query: { status: ["PENDING"] },
	})

	if (chan_invites.status === 200 && friend_requests.status === 200) {
		return { friend_requests: friend_requests.body, chan_invites: chan_invites.body }
	} else
		return {
			friend_requests: { incoming: [], outcoming: [] },
			chan_invites: { incoming: [], outcoming: [] },
		}
}
