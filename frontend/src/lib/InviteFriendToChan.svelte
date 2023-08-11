<script lang="ts">
	import type { AutocompleteOption } from "@skeletonlabs/skeleton"

	import { Autocomplete, InputChip, toastStore } from "@skeletonlabs/skeleton"
	import { invalidate } from "$app/navigation"
	import { client } from "$clients"
	import { createEventDispatcher } from "svelte"

	export let friendList: string[]
	export let chan_id: string

	let friendOptions: AutocompleteOption[]
	$: friendOptions = friendList.map((username) => ({
		label: username,
		value: username,
	}))

	const dispatch = createEventDispatcher()

	let priv: boolean = false
	let form: HTMLFormElement
	async function handleDiscussionCreation() {
		let formdata = new FormData(form) // `form` is bound to the form node
		const usernames: string[] = formdata.getAll("users") as string[]
		for (let invitedUserName of usernames) {
			client.invitations.chan.createChanInvitation({
				body: { chanId: chan_id, invitedUserName },
			})
		}
		invalidate(":channels") // Seems reasonnable and simpler to reload all the whole channel list
		dispatch("submit")
	}

	function validation(_username: string): boolean {
		return friendList.indexOf(_username) !== -1
	}

	let input: string
	let value: string[]

	function onInputChipSelect(event: CustomEvent<AutocompleteOption>) {
		value = [...value, event.detail.value as string]
	}
</script>

<!-- TODO: Try width: min-content; on the form's parent or display: inline-block; on the form element to see if it fixes unwantd widening  -->
<form bind:this={form} on:submit|preventDefault={handleDiscussionCreation} class="">
	{#if friendList.length != 0}
		<label for="invites" class="label">Send invites</label>
		<InputChip bind:input bind:value name="users" id="invites" {validation} />
		<Autocomplete
			bind:input
			denylist={value}
			options={friendOptions}
			on:selection={onInputChipSelect}
			emptyState="No such friend found"
			class="card overflow-y-auto p-4"
		/>
	{/if}
	<div class="mt-3">
		<button type="submit" class="btn variant-filled"> Send Invites </button>
		<button type="button" class="btn variant-filled" on:click={() => dispatch("cancel")}>
			Cancel
		</button>
	</div>
</form>

<style>
</style>
