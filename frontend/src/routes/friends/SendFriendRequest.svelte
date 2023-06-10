<script lang="ts">
	import type { TableSource } from "@skeletonlabs/skeleton"

	import { friendsClient, invitationsClient } from "$clients"
	import { toastStore } from "@skeletonlabs/skeleton"
	import { my_name } from "$stores"
	import { invalidate } from "$app/navigation"

	let invitee: string

	let friend_request_form: HTMLFormElement
	async function sendFriendRequest() {
		const username = new FormData(friend_request_form).get("invitee")! as string
		const { status, body } = await invitationsClient.friend.createFriendInvitation({
			body: { invitedUserName: username },
		})
		if (status != 201) {
			const message = `Could not create friend request. Server returned code ${status}\n with message \"${
				(body as any)?.message
			}\"`
			toastStore.trigger({
				message,
			})
			console.error(message)
		} else invalidate(":friendships")
	}
</script>

<div class="m-14">
	<form
		method="POST"
		on:submit|preventDefault={sendFriendRequest}
		bind:this={friend_request_form}
	>
		<label for="invitee" class="label mx-3"> Send friendship request </label>
		<input
			bind:value={invitee}
			name="invitee"
			id="invitee"
			type="text"
			required
			class="input m-3"
		/>
		<button id="login" type="submit" class="variant-filled-success btn m-3">
			Send friend request
		</button>
	</form>
</div>

<style>
</style>
