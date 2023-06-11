import type { LoadEvent } from "@sveltejs/kit"
import { friendsClient, invitationsClient } from "$lib/clients"

export const load = async ({ depends }: LoadEvent) => {
	depends(":friendships")
	depends(":invitations")

	const { status: retcode1, body: friendships } = await friendsClient.getFriends()
	if (retcode1 !== 200) {
		console.log(
			`Failed to load friendship list. Server returned code ${retcode1} with message \"${
				(friendships as any)?.message
			}\"`,
		)
	} else console.log("Loaded friendship list")

	const { status: retcode2, body: friend_requests } =
		await invitationsClient.friend.getFriendInvitations({
			query: { status: ["PENDING"] },
		})
	if (retcode2 !== 200) {
		console.log(
			`Failed to load friendship request list. Server returned code ${retcode2} with message \"${
				(friend_requests as any)?.message
			}\"`,
		)
	} else console.log("Loaded friendship requests list")
    console.log({ friendships, friend_requests })
	return { friendships, friend_requests }
}
