<script lang="ts">
	import { invitationsClient } from "$clients"
	import { toastStore } from "@skeletonlabs/skeleton"
	import { invalidate } from "$app/navigation"

	let invitee: string

	let friend_request_form: HTMLFormElement
	async function sendFriendRequest() {
		const username = new FormData(friend_request_form).get("invitee")! as string
		const { status, body } = await invitationsClient.friend.createFriendInvitation({
			body: { invitedUserName: username },
		})
		let message
		if (status != 201) {
			message = `Could not create friend request. Server returned code ${status}\n with message \"${
				(body as any)?.message
			}\"`
			console.error(message)
		} else {
			invalidate(":friendships")
			message = "Sent friendship request to " + username
		}
		toastStore.trigger({
			message,
		})
	}
</script>

<form
	method="POST"
	on:submit|preventDefault={sendFriendRequest}
	bind:this={friend_request_form}
	class="form-input grid grid-rows-2 gap-2 rounded-xl"
>
	<input bind:value={invitee} name="invitee" type="text" required class="input" />
	<button type="submit" class="btn btn-sm variant-filled-success justify-self-center">
		Send friend request
	</button>
</form>

<style>
</style>
