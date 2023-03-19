<script lang="ts">
	import { InputChip, toastStore } from "@skeletonlabs/skeleton"
	import { fetchPostJSON } from "$lib/global"

	let show_discussion_creation_form = false
	let minlength = 3
	let maxlength = 100

	let form: HTMLFormElement
	async function handleDiscussionCreation() {
		show_discussion_creation_form = false
		let formdata = new FormData(form) // `form` is bound to the form node
		console.log(formdata)
		let res = await fetchPostJSON("/chat/createDiscussion", {
			title: formdata.get("title"),
			users: formdata.get("users")
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
</script>

{#if !show_discussion_creation_form}
	<button
		on:click={() => (show_discussion_creation_form = true)}
		class="btn variant-filled shadow-white">
		+
	</button>
{:else}
	<form bind:this={form} on:submit|preventDefault|stopPropagation={handleDiscussionCreation}>
		<label class="label">
			Choose a name for the conversation
			<input type="text" name="title" required {minlength} {maxlength} class="input" />
		</label>
		<InputChip name="users" {validation} />
		<button type="submit" class="btn variant-filled"> Create Discussion </button>
	</form>
{/if}
