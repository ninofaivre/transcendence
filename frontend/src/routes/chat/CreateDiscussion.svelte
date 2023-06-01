<script lang="ts">
	import type { AutocompleteOption } from "@skeletonlabs/skeleton"

	import { Autocomplete, InputChip, toastStore } from "@skeletonlabs/skeleton"
	import { invalidate } from "$app/navigation"
	import { chansClient } from "$clients"

	let show_discussion_creation_form = false
	let minlength = 3
	let maxlength = 100

	let priv: boolean = false
	let form: HTMLFormElement
	async function handleDiscussionCreation() {
		show_discussion_creation_form = false

		let formdata = new FormData(form) // `form` is bound to the form node
		const title: string = formdata.get("title") as string
		const type = priv ? "PRIVATE" : "PUBLIC"
		const { status, body } = await chansClient.createChan({
			body: { type, title },
		})
		if (status > 299) {
			toastStore.trigger({
				message: `Could not create new discussion channel. Server returned code ${status}\n with message \"${
					(body as any)?.message
				}\"`,
			})
		} else {
			console.log("Server returned:", status)
			invalidate(":discussions")
		}
	}

	function validation(_username: string): boolean {
		return true
	}

	let input: string
	let value: string[]

	let friends: string[] = ["alice", "bob", "cha", "denis", "john", "zelda"]
	let friendOptions: AutocompleteOption[] = friends.map((username) => ({
		label: username,
		value: username,
	}))

	function onInputChipSelect(event: any): void {
		value = [...value, event.detail.value]
	}
</script>

{#if !show_discussion_creation_form}
	<button
		on:click={() => (show_discussion_creation_form = true)}
		class="btn variant-filled w-full"
	>
		Create new discussion
	</button>
{:else}
	<!-- TODO: Try width: min-content; on the form's parent or display: inline-block; on the form element to see if it fixes unwantd widening  -->
	<form
		bind:this={form}
		on:submit|preventDefault|stopPropagation={handleDiscussionCreation}
		class=""
	>
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
		<button type="submit" class="btn variant-filled"> Create room </button>
		<button
			type="button"
			class="btn variant-filled"
			on:click={() => (show_discussion_creation_form = false)}
		>
			Cancel
		</button>
	</form>
{/if}

<style>
</style>
