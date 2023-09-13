<script lang="ts">
	import { client } from "$clients"
	import { getModalStore } from "@skeletonlabs/skeleton"
	import { zChanPassword, zChanTitle } from "contract"

	const modalStore = getModalStore()

	let priv: boolean = false
	let form: HTMLFormElement

	let titles: string[] = []
	let title_input: string
	let can_send: boolean

	async function onDiscussionCreation() {
		let formdata = new FormData(form) // `form` is bound to the form node
		const title: string = formdata.get("title") as string
		const type = priv ? "PRIVATE" : "PUBLIC"
		const password: string | undefined = priv
			? undefined
			: (formdata.get("password") as string | null) || undefined
		if ($modalStore[0]?.response) {
			$modalStore[0].response({ type, title, password })
		}
	}

	function onClose() {
		if ($modalStore[0]?.response) {
			$modalStore[0].response(undefined)
		}
	}

	async function getRoomList(input: string) {
		const ret = await client.chans.searchChans({
			query: {
				titleContains: input,
			},
		})
		if (ret.status !== 200) {
		} else {
			titles = ret.body.map((el) => el.title)
			console.log(titles)
		}
	}

	$: {
		if (title_input) {
			getRoomList(title_input)
		}
	}
	$: {
		if (titles.length > 0 && titles.includes(title_input)) {
			can_send = false
		} else {
			can_send = true
		}
	}
</script>

<form
	bind:this={form}
	on:submit|preventDefault={onDiscussionCreation}
	class="card w-full space-y-4 p-6"
>
	<label for="title" class="label"> Choose a name for the room (anything but '@')</label>
	<input
		bind:value={title_input}
		type="text"
		name="title"
		id="title"
		minlength={zChanTitle.minLength}
		maxlength={zChanTitle.maxLength}
		pattern="[^@]*"
		class="peer input"
		required
		autocomplete="off"
	/>
	<sub
		class={!can_send
			? "invisible p-2 text-red-500 peer-focus-within:visible"
			: "invisible p-2 text-green-500 peer-focus-within:visible"}
	>
		{#if !can_send}
			This name is already taken
		{:else if title_input}
			Available
		{/if}
	</sub>
	<label for="password" class="label">Password (Optional)</label>
	<input
		type="text"
		name="password"
		id="password"
		minlength={zChanPassword.minLength}
		maxlength={zChanPassword.maxLength}
		class="input"
		disabled={priv}
	/>
	<label for="priv" class="label">Make private</label>
	<input id="priv" type="checkbox" bind:checked={priv} class="checkbox" />
	<footer class="modal-footer">
		<button type="button" class="variant-ghost-error btn" on:click={onClose}>Cancel</button>
		<button type="submit" disabled={!can_send} class="variant-ghost btn">Create Room</button>
	</footer>
</form>

<style>
</style>
