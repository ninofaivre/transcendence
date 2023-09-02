<script lang="ts">
	import Autocomplete from "$lib/Autocomplete.svelte"
	import type { AutocompleteOption } from "@skeletonlabs/skeleton"

	import { onMount } from "svelte"
	import { client } from "$clients"
	import { getModalStore } from "@skeletonlabs/skeleton"
	import { checkError } from "./global"

	const modalStore = getModalStore()
	let search_input: string = ""
	let password_input: string = ""
	let users: AutocompleteOption[] = []
	let input_element: HTMLElement
	let send_button: HTMLButtonElement
	let input_focused = false
	let password_element: HTMLInputElement

	async function sendBackData(data: [name: string, password: string]) {
		if ($modalStore[0].response) {
			$modalStore[0].response(data)
		}
	}

	async function onUserSelection(event: CustomEvent<AutocompleteOption>) {
		search_input = event.detail.label
		password_needed = event.detail.meta
		input_focused = false
		if (password_needed) password_element.focus()
		else send_button.focus()
	}

	async function getChanList(input: string) {
		return client.chans
			.searchChans({
				query: {
					titleContains: input,
				},
			})
			.then((ret) => {
				if (ret.status !== 200) {
					checkError(ret, "get room list")
				} else {
					users = ret.body.map((obj) => ({
						label: obj.title,
						value: obj.title,
						meta: obj.passwordProtected,
					}))
				}
			})
	}

	async function onKeypress(event: KeyboardEvent) {
		switch (event.key) {
			case "Enter":
				if (users.find((el) => el.value === search_input)?.meta) {
					password_element.focus
				}
				sendBackData([search_input, password_input])
		}
	}

	$: if (search_input) getChanList(search_input)

	onMount(() => void input_element.focus())

	let password_needed: boolean = false
</script>

<div class="card flex flex-col items-center gap-2 p-8">
	<!-- input container -->
	<div class="relative min-w-[50vw] flex-1">
		<input
			bind:this={input_element}
			class="input"
			type="search"
			bind:value={search_input}
			placeholder="Search room..."
			on:focusin={() => void (input_focused = true)}
			on:focusout={() => void (input_focused = false)}
			on:keypress={onKeypress}
		/>
		{#if input_focused && search_input}
			<div class="card absolute z-10 mt-1 max-h-48 w-full overflow-y-auto p-2" tabindex="-1">
				<Autocomplete
					options={users}
					on:selection={onUserSelection}
					regionButton="w-full btn-md"
					class="w-full"
				/>
			</div>
		{/if}
	</div>
	<!-- password field -->
	<input
		class="input flex-1"
		bind:this={password_element}
		type="text"
		bind:value={password_input}
		placeholder="Password"
		disabled={!password_needed}
		required={password_needed}
	/>
	<!-- send button -->
	<button
		bind:this={send_button}
		on:click={() => {
			sendBackData([search_input, password_input])
		}}
		class="variant-filled-primary btn w-fit justify-self-center px-12"
	>
		Send
	</button>
</div>

<style>
	input {
		border-radius: 15px;
	}
</style>
