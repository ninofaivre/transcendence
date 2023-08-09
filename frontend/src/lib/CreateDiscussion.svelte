<script lang="ts">
	import type { AutocompleteOption } from "@skeletonlabs/skeleton"

	import { Autocomplete, InputChip, toastStore } from "@skeletonlabs/skeleton"
	import { invalidate } from "$app/navigation"
	import { client } from "$clients"
	import { page } from "$app/stores"
	import { createEventDispatcher } from "svelte"

	export let friendList: string[]

	let minlength = 3
	let maxlength = 100
	const dispatch = createEventDispatcher()

	let priv: boolean = false
	let form: HTMLFormElement
	async function handleDiscussionCreation() {
		let formdata = new FormData(form) // `form` is bound to the form node
		const title: string = formdata.get("title") as string
		const type = priv ? "PRIVATE" : "PUBLIC"
		const usernames: string[] = formdata.getAll("users") as string[]
		const { status, body } = await client.chans.createChan({
			body: { type, title },
		})
		if (status == 201) {
			console.log("Server returned:", status, body)
			for (let invitedUserName in usernames) {
				client.invitations.chan.createChanInvitation({
					body: { chanId: body.id, invitedUserName },
				})
			}
			invalidate(":channels") // Seems reasonnable and simpler to reload all the whole channel list
			dispatch("submit")
		} else {
			toastStore.trigger({
				message: `Could not create new discussion channel. Server returned code ${status}\n with message \"${
					(body as any)?.message
				}\"`,
			})
		}
	}

	function validation(_username: string): boolean {
		const friends = $page.data?.friendships
		if (friends) {
			return friends.indexOf(_username) !== -1
		}
		return true
	}

	let input: string
	let value: string[]
	let friendOptions: AutocompleteOption[] = friendList.map((username) => ({
		label: username,
		value: username,
	}))

	function onInputChipSelect(event: any): void {
		value = [...value, event.detail.value]
	}
</script>

<!-- TODO: Try width: min-content; on the form's parent or display: inline-block; on the form element to see if it fixes unwantd widening  -->
<form bind:this={form} on:submit|preventDefault={handleDiscussionCreation} class="">
	<label for="title" class="label">
		Choose a name for the room {priv ? "if you care" : ""}
	</label>
	<input
		type="text"
		name="title"
		id="title"
		{minlength}
		{maxlength}
		class="input"
		required={!priv}
	/>
	<label for="priv" class="label">Make private</label>
	<input id="priv" type="checkbox" bind:checked={priv} />
	{#if friendList.length != 0}
		<label for="invites" class="label">Send invites</label>
		<InputChip bind:input bind:value name="users" id="invites" {validation} />
		<Autocomplete
			bind:input
			blacklist={value}
			options={friendOptions}
			on:selection={onInputChipSelect}
			emptyState="No such friend found"
			class="card overflow-y-auto p-4"
		/>
	{/if}
	<div class="mt-3">
		<button type="submit" class="btn variant-filled"> Create room </button>
		<button type="button" class="btn variant-filled" on:click={() => dispatch("cancel")}>
			Cancel
		</button>
	</div>
</form>

<style>
</style>
