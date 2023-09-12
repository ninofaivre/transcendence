<script lang="ts">
	import Autocomplete from "$components/Autocomplete.svelte"
	import type { AutocompleteOption } from "@skeletonlabs/skeleton"

	import { onMount } from "svelte"
	import { client } from "$clients"
	import { getModalStore } from "@skeletonlabs/skeleton"
	import { simpleKeypressHandlerFactory } from "$lib/global"
	import { tick } from "svelte"

	const modalStore = getModalStore()
	const checkError: (ret: { status: number; body: any }, what: string) => void = (window as any)
		.checkError
	let search_input: string = ""
	let password_input: string = ""
	let chans: AutocompleteOption[] = []
	let input_element: HTMLElement
	let send_button: HTMLButtonElement
	let input_focused = false
	let password_element: HTMLInputElement
	let can_send: boolean = false
	let password_needed: boolean = false
	let id: string

	async function sendBackData() {
		const title = search_input
		const password = password_input || undefined

		if ($modalStore[0]?.response) {
			$modalStore[0].response({ title, password, id })
		}
	}

	async function onUserSelection(event: CustomEvent<AutocompleteOption>) {
		search_input = event.detail.label
		;({ password_needed, id } = event.detail.meta)
		input_focused = false
		if (password_needed) password_element.focus()
		else {
			can_send = true
			await tick()
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
						meta: { password_needed: obj.passwordProtected, id: obj.id },
					}))
				}
			})
	}

	function onSearchEnter() {
		if (chans.find((el) => el.value === search_input)?.meta) {
			password_element.focus
		} else send_button.focus()
	}

	function onPasswordEnter(event: KeyboardEvent) {
		send_button.focus()
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

<div class="card flex flex-col items-center gap-2 p-8">
	<!-- input container -->
	<div class="relative min-w-[50vw] flex-1">
		<input
			bind:this={input_element}
			class="input"
			type="search"
			name="title"
			bind:value={search_input}
			placeholder="Search room..."
			on:focusin={() => void (input_focused = true)}
			on:keypress={simpleKeypressHandlerFactory(["Enter"], onSearchEnter)}
			autocomplete="off"
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
		on:click={sendBackData}
		on:keypress={simpleKeypressHandlerFactory(["Enter"], sendBackData)}
	>
		Send
	</button>
</div>

<style>
	input {
		border-radius: 15px;
	}
</style>
