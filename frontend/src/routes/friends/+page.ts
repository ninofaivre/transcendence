import type { LoadEvent } from "@sveltejs/kit"
import { client } from "$lib/clients"

export const load = async ({ depends }: LoadEvent) => {
	depends(":chans:invitations")
	const { status: retcode1, body: chan_invites } =
		await client.invitations.chan.getChanInvitations({
			query: { status: ["PENDING"] },
		})
	if (retcode1 !== 200) {
		console.log(
			`Failed to load chans invitations list. Server returned code ${retcode1} with message \"${(
				chan_invites as any
			)?.message}\"`,
		)
	} else console.log("Loaded chan invites ")

	depends(":friends:invitations")
	const { status: retcode2, body: friend_requests } =
		await client.invitations.friend.getFriendInvitations({
			query: { status: ["PENDING"] },
		})
	if (retcode2 !== 200) {
		console.log(
			`Failed to load friendship request list. Server returned code ${retcode2} with message \"${(
				friend_requests as any
			)?.message}\"`,
		)
	} else console.log("Loaded friend requests")

	console.log({ friend_requests, chan_invites })
	return { friend_requests, chan_invites }
}
