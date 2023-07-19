<script lang="ts">
	import Autocomplete from "$lib/Autocomplete.svelte"
	import type { AutocompleteOption } from "@skeletonlabs/skeleton"

	import { client } from "$clients"
	import { invalidate } from "$app/navigation"
	import { reportUnexpectedCode, listenOutsideClick } from "$lib/global"

	let search_input: string = ""
	let users: AutocompleteOption[] = []
	let input_focused = false

	async function sendFriendRequest(username: string) {
		const { status, body } = await client.invitations.friend.createFriendInvitation({
			body: { invitedUserName: username },
		})
		if (status != 201) {
			reportUnexpectedCode(status, "create friend request", body, "error")
		} else {
			invalidate(":friendships")
			console.log("Sent friendship request to " + username)
		}
	}

	async function onUserSelection(event: any) {
		search_input = event.detail.label
		input_focused = false
	}

	async function getUsernames(input: string) {
		return client.users
			.searchUsers({
				query: {
					userNameContains: input,
					filter: {
						type: "inc",
						friends: false,
					},
				},
			})
			.then(({ status, body }) => {
				console.log(body)
				if (status === 200) {
					users = body.map((obj) => ({ label: obj.userName, value: obj.userName }))
				} else reportUnexpectedCode(status, "get users' names", body)
			})
	}

	async function onKeypress(event: KeyboardEvent) {
		if (event.shiftKey == false) {
			switch (event.key) {
				case "Enter":
					sendFriendRequest(search_input)
					event.preventDefault() // Prevent actual input of the newline that triggered sending
			}
		}
	}

	$: if (search_input) getUsernames(search_input)
</script>

<div use:listenOutsideClick on:outsideclick={() => void (input_focused = false)}>
	<div id="grid" class="grid min-w-[50vw] grid-cols-[1fr_auto]">
		<div id="container">
			<input
				class="input"
				type="search"
				bind:value={search_input}
				placeholder="Search user..."
				on:focusin={() => void (input_focused = true)}
				on:keypress={onKeypress}
			/>
		</div>
		<button
			id="button"
			on:click={() => void sendFriendRequest(search_input)}
			class="variant-filled-primary hover:font-medium"
		>
			Send
		</button>
	</div>

	{#if input_focused}
		<div class="card max-h-48 w-full max-w-sm overflow-y-auto p-4" tabindex="-1">
			<Autocomplete options={users} on:selection={onUserSelection} />
		</div>
	{/if}
</div>

<style>
	#container {
		position: relative;
	}
</style>
