<script lang="ts">
	import Autocomplete from "$lib/Autocomplete.svelte"
	import type { AutocompleteOption } from "@skeletonlabs/skeleton"

	import { onMount } from "svelte"
	import { client } from "$clients"
	import { getModalStore } from "@skeletonlabs/skeleton"
	import { checkError, simpleKeypressHandlerFactory } from "./global"

	const modalStore = getModalStore()
	let search_input: string = ""
	let password_input: string = ""
	let chans: AutocompleteOption[] = []
	let input_element: HTMLElement
	let send_button: HTMLButtonElement
	let input_focused = false
	let password_element: HTMLInputElement
	let can_send: boolean = false
	let password_needed: boolean = false
	let form: HTMLFormElement

	async function sendBackData(e: SubmitEvent) {
		const formdata = new FormData(form)
		const chan = formdata.get("chan")
		const password = formdata.get("password")

		if ($modalStore[0].response) {
			$modalStore[0].response({ chan, password })
		}
	}

	async function onUserSelection(event: CustomEvent<AutocompleteOption>) {
		search_input = event.detail.label
		password_needed = event.detail.meta
		input_focused = false
		if (password_needed) password_element.focus()
		else {
			can_send = true
			send_button.focus()
		}
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
					chans = ret.body.map((obj) => ({
						label: obj.title,
						value: obj.title,
						meta: obj.passwordProtected,
					}))
					console.log(chans)
				}
			})
	}

	function onSearchEnter(event: KeyboardEvent) {
		if (chans.find((el) => el.value === search_input)?.meta) {
			password_element.focus
		} //else sendBackData([search_input, password_input])
	}

	function onPasswordEnter(event: KeyboardEvent) {
		//sendBackData([search_input, password_input])
	}

	$: if (search_input) getChanList(search_input)
	$: {
		if (!chans.find((el) => el.label === search_input)) {
			can_send = false
		}
	}
	$: if (password_needed && !password_input) can_send = false
	$: if (password_input) can_send = true

	onMount(() => void input_element.focus())
</script>

<form
	class="card flex flex-col items-center gap-2 p-8"
	bind:this={form}
	on:submit|preventDefault={sendBackData}
>
	<!-- input container -->
	<div class="relative min-w-[50vw] flex-1">
		<input
			bind:this={input_element}
			class="input"
			type="search"
			name="chan"
			bind:value={search_input}
			placeholder="Search room..."
			on:focusin={() => void (input_focused = true)}
			on:keypress={simpleKeypressHandlerFactory(["Enter"], onSearchEnter)}
		/>
		{#if search_input && input_focused}
			<div class="card absolute z-10 mt-1 max-h-48 w-full overflow-y-auto p-2" tabindex="-1">
				<Autocomplete
					options={chans}
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
		name="password"
		bind:value={password_input}
		placeholder="Password"
		disabled={!password_needed}
		required={password_needed}
		on:keypress={simpleKeypressHandlerFactory(["Enter"], onPasswordEnter)}
	/>
	<!-- send button -->
	<button
		bind:this={send_button}
		type="submit"
		class="variant-filled-primary btn w-fit justify-self-center px-12"
		disabled={!can_send}
	>
		Send
	</button>
</form>

<style>
	input {
		border-radius: 15px;
	}
</style>
