import type { LoadEvent } from "@sveltejs/kit"
import { dmsClient, friendsClient } from "$lib/clients"

export const load = async ({ depends }: LoadEvent) => {
	depends(":discussions")
	const { status, body: discussions } = await dmsClient.getDms()
	if (status !== 200) {
		console.log(
			`Failed to load channel list. Server returned code ${status} with message \"${
				(discussions as any)?.message
			}\"`,
		)
	}

	depends(":friends")
	const { status: status2, body: friendships} = await friendsClient.getFriends() 
    let friendList: string[] = []
	if (status2 === 200) {
        friendList = friendships.map((friendship) => friendship.friendName)
	}
    else {
		console.log(
			`Failed to load friend list. Server returned code ${status2} with message \"${
				(friendships as any)?.message
			}\"`,
		)
    }
    return { discussions, friendships, friendList }
}
