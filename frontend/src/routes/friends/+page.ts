import type { LoadEvent } from "@sveltejs/kit"
import { usersClient, friendsClient, invitationsClient } from "$lib/clients"

export const load = async ({ depends }: LoadEvent) => {
	const ret: any = {}
	depends(":friends")
	depends(":invitations")
	{
		const { status, body } = await friendsClient.getFriends()
		if (status !== 200) {
			console.log(
				`Failed to load friend list. Server returned code ${status} with message \"${
					(body as any)?.message
				}\"`,
			)
		} else ret.friends = body
	}

	{
		const { status, body } = await invitationsClient.getFriendInvitationsByType({
			params: { type: "INCOMING" },
		})
		if (status !== 200) {
			console.log(
				`Failed to load friend list. Server returned code ${status} with message \"${
					(body as any)?.message
				}\"`,
			)
		} else ret.friend_requests = body
	}
	return ret
}
