<script lang="ts">
	import type { AutocompleteOption } from "@skeletonlabs/skeleton"

	import { Autocomplete, InputChip, toastStore } from "@skeletonlabs/skeleton"
	import { invalidate } from "$app/navigation"
	import { client } from "$clients"
	import { page } from "$app/stores"
	import { createEventDispatcher } from "svelte"

	export let friendList: string[]

	let friendOptions: AutocompleteOption[]
	$: friendOptions = friendList.map((username) => ({
		label: username,
		value: username,
	}))

	let minlength = 3
	let maxlength = 100
	const dispatch = createEventDispatcher()

	let priv: boolean = false
	let form: HTMLFormElement
	async function handleDiscussionCreation() {
		let formdata = new FormData(form) // `form` is bound to the form node
		const title: string = formdata.get("title") as string
		const type = priv ? "PRIVATE" : "PUBLIC"
		const { status, body } = await client.chans.createChan({
			body: { type, title },
		})
		if (status == 201) {
			console.log("Server returned:", status, body)
			invalidate(":chans") // Seems reasonnable and simpler to reload all the whole channel list
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
	<div class="mt-3">
		<button type="submit" class="btn variant-filled"> Create room </button>
		<button type="button" class="btn variant-filled" on:click={() => dispatch("cancel")}>
			Cancel
		</button>
	</div>
</form>

<style>
</style>
