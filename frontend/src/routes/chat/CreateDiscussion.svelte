<script lang="ts">
	import type { AutocompleteOption } from "@skeletonlabs/skeleton"

	import { Autocomplete, InputChip, toastStore } from "@skeletonlabs/skeleton"
	import { fetchPostJSON } from "$lib/global"

	let show_discussion_creation_form = false
	let minlength = 3
	let maxlength = 100

	let form: HTMLFormElement
	async function handleDiscussionCreation() {
		show_discussion_creation_form = false
		let formdata = new FormData(form) // `form` is bound to the form node
		console.log(formdata)
		console.log(formdata.getAll("users"))
		let res = await fetchPostJSON("/chat/createDiscussion", {
			title: formdata.get("title"),
			users: formdata.getAll("users")
		})
		if (!res.ok) {
			let body = await res.json()
			toastStore.trigger({
				message: `Error: ${res.statusText}\nCould not create new discussion because ${body.message}`
			})
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
		value: username
	}))

	function onInputChipSelect(event: any): void {
		value = [...value, event.detail.value]
	}
</script>

{#if !show_discussion_creation_form}
	<button on:click={() => (show_discussion_creation_form = true)} class="btn variant-filled w-full">
		Create new discussion
	</button>
{:else}
	<!-- TODO: Try width: min-content; on the form's parent or display: inline-block; on the form element to see if it fixes unwantd widening  -->
	<form
		bind:this={form}
		on:submit|preventDefault|stopPropagation={handleDiscussionCreation}
		class=""
	>
		<label class="label">
			Choose a name for the conversation
			<input type="text" name="title" {minlength} {maxlength} class="input" />
		</label>
		<InputChip bind:input bind:value name="users" {validation} />
		<Autocomplete
			bind:input
			blacklist={value}
			options={friendOptions}
			on:selection={onInputChipSelect}
			emptyState="No such friend found"
			class="card overflow-y-auto p-4"
		/>
		<button type="submit" class="btn variant-filled"> Create Discussion </button>
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
