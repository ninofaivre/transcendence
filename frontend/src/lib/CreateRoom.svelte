<script lang="ts">
	import { modalStore } from "@skeletonlabs/skeleton"

	import type { AutocompleteOption } from "@skeletonlabs/skeleton"

	import { Autocomplete, InputChip } from "@skeletonlabs/skeleton"
	import { createEventDispatcher } from "svelte"

	async function handleDiscussionCreation() {
		let formdata = new FormData(form) // `form` is bound to the form node
		const title: string = formdata.get("title") as string
		const type = priv ? "PRIVATE" : "PUBLIC"
		if ($modalStore[0].response) {
			$modalStore[0].response({ type, title })
		}
	}

	function onClose() {
		if ($modalStore[0].response) {
			$modalStore[0].response(undefined)
		}
	}

	let minlength = 3
	let maxlength = 100

	let priv: boolean = false
	let form: HTMLFormElement
</script>

<form bind:this={form} on:submit|preventDefault={handleDiscussionCreation} class="space-y-4">
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
	<div class="mt-3"></div>

	<footer class="modal-footer">
		<button type="button" class="btn variant-ghost-surface" on:click={onClose}>Cancel</button>
		<button type="submit" class="btn variant-filled">Create Room</button>
	</footer>
</form>

<style>
</style>
