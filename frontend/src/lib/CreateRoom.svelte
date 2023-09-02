<script lang="ts">
	import { getModalStore } from "@skeletonlabs/skeleton"

	const modalStore = getModalStore()

	async function onDiscussionCreation() {
		let formdata = new FormData(form) // `form` is bound to the form node
		const title: string = formdata.get("title") as string
		const type = priv ? "PRIVATE" : "PUBLIC"
		const password: string | undefined = priv
			? undefined
			: (formdata.get("password") as string | null) ?? undefined
		if ($modalStore[0].response) {
			$modalStore[0].response({ type, title, password })
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

<form
	bind:this={form}
	on:submit|preventDefault={onDiscussionCreation}
	class="card w-full space-y-4 p-6"
>
	<label for="title" class="label"> Choose a name for the room </label>
	<input type="text" name="title" id="title" {minlength} {maxlength} class="input" required />
	<label for="Password" class="label">Password (Optional)</label>
	<input
		type="text"
		name="title"
		id="password"
		{minlength}
		{maxlength}
		class="input"
		disabled={priv}
	/>
	<label for="priv" class="label">Make private</label>
	<input id="priv" type="checkbox" bind:checked={priv} class="checkbox" />
	<footer class="modal-footer">
		<button type="button" class="variant-ghost-error btn" on:click={onClose}>Cancel</button>
		<button type="submit" class="variant-ghost btn">Create Room</button>
	</footer>
</form>

<style>
</style>
