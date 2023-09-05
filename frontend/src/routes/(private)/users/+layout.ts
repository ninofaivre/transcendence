import type { LayoutLoad } from "./$types"
import { client } from "$clients"
import { checkError } from "$lib/global"

export const load: LayoutLoad = async ({ depends }) => {
	console.log("layout load function from chans/ ")

	depends(":users:invitations")
	const friend_invitations = await client.invitations.friend.getFriendInvitations()

	if (friend_invitations.status !== 200) {
        checkError(friend_invitations, "load friend invitations")
        return { friend_invitations: [] }
    } else return { friend_invitations: friend_invitations.body }
}
