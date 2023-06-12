import type { LayoutLoad , LayoutLoadEvent} from "./$types"
import { dmsClient, friendsClient } from "$lib/clients"

export const load = async ({ depends }: LayoutLoadEvent) => {
	depends(":discussions")
	const { status, body: dmList } = await dmsClient.getDms()
	if (status !== 200) {
		console.log(
			`Failed to load channel list. Server returned code ${status} with message \"${
				(dmList as any)?.message
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
    console.log("List of your DMS: ",  dmList)
    return { dmList, friendships, friendList }
} 
