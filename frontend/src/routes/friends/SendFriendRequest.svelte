<script lang="ts">
	import { Autocomplete } from "@skeletonlabs/skeleton"
	import type { AutocompleteOption } from "@skeletonlabs/skeleton"

	import { invitationsClient, usersClient } from "$clients"
	import { toastStore } from "@skeletonlabs/skeleton"
	import { invalidate } from "$app/navigation"
	import { reportUnexpectedCode } from "$lib/global"

	let search_input: string
	let users: AutocompleteOption[] = []

	async function sendFriendRequest(username: string) {
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

	async function onUserSelection(event: any) {
		sendFriendRequest(event.detail.label)
	}

	function getUsernames(input: string) {
		return usersClient
			.searchUsers({
				query: {
					userNameContains: input,
				},
			})
			.then(({ status, body }) => {
				console.log(body)
				if (status === 200) {
					users = body.map((obj) => {
						return { label: obj.userName, value: obj.userName }
					})
				} else reportUnexpectedCode(status, "create friend request", body)
			})
	}

	$: getUsernames(search_input)
</script>

<input class="input" type="search" bind:value={search_input} placeholder="Search user..." />

<div class="card max-h-48 w-full max-w-sm overflow-y-auto p-4" tabindex="-1">
	<Autocomplete bind:input={search_input} bind:options={users} on:selection={onUserSelection} />
</div>

<style>
</style>
