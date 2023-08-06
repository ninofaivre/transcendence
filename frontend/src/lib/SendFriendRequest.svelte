<script lang="ts">
	import Autocomplete from "$lib/Autocomplete.svelte"
	import type { AutocompleteOption } from "@skeletonlabs/skeleton"

	import { client } from "$clients"
	import { invalidate } from "$app/navigation"
	import { reportUnexpectedCode, listenOutsideClick } from "$lib/global"

	let search_input: string = ""
	let users: AutocompleteOption[] = []
	let send_button: HTMLButtonElement
	let input_focused = false
	let border_radius = "15px"

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
		send_button.focus()
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
					search_input = ""
			}
		}
	}

	$: if (search_input) getUsernames(search_input)
</script>

<div use:listenOutsideClick on:outsideclick={() => void (input_focused = false)}>
	<div class="grid min-w-[50vw] grid-cols-[1fr_auto]">
		<input
			class="input py-2"
			type="search"
			bind:value={search_input}
			placeholder="Search user..."
			on:focusin={() => void (input_focused = true)}
			on:keypress={onKeypress}
			style="--border-radius-var: {border_radius}"
		/>
		<button
			bind:this={send_button}
			on:click={() => {
				sendFriendRequest(search_input)
				search_input = ""
			}}
			class="variant-filled-primary hover:font-medium"
			style="--border-radius-var: {border_radius}"
		>
			Send
		</button>
	</div>

	{#if input_focused}
		<div class="card my-2 max-h-48 w-full overflow-y-auto p-2" tabindex="-1">
			<Autocomplete
				options={users}
				on:selection={onUserSelection}
				regionButton="w-full btn-md"
			/>
		</div>
	{/if}
</div>

<style>
	input {
		border-radius: var(--border-radius-var) 0px 0px var(--border-radius-var);
	}

	button {
		border-top-right-radius: var(--border-radius-var);
		border-bottom-right-radius: var(--border-radius-var);
		/* top | right | bottom | left */
		padding: 0px 8px 0px 5px;
	}
</style>
