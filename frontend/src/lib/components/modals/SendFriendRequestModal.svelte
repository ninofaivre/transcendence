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
	let users: AutocompleteOption[] = []
	let input_element: HTMLElement
	let send_button: HTMLButtonElement
	let input_focused = false
	let can_send: boolean = false
	let to_send_back: string

	async function sendBackData() {
		if ($modalStore[0]?.response) {
			$modalStore[0].response(to_send_back)
		}
	}

	async function onUserSelection(event: CustomEvent<AutocompleteOption>) {
		search_input = event.detail.label
		to_send_back = event.detail.value as string
		input_element.focus()
	}

	async function getUserList(input: string) {
		const ret = await client.users.searchUsersV2({
			query: {
				params: {},
				displayNameContains: input,
				action: "CREATE_FRIEND_INVITE",
			},
		})
		if (ret.status !== 200) {
			checkError(ret, "get room list")
		} else {
			users = ret.body.map((obj) => ({
				label: obj.displayName,
				value: obj.userName,
			}))
		}
	}

	async function onSearchEnter() {
		if (can_send) {
			await tick()
			send_button.focus()
		}
	}

	$: if (search_input) getUserList(search_input)
	$: {
		if (users.find((el) => el.label === search_input)) {
			can_send = true
		} else can_send = false
	}

	onMount(() => void input_element.focus())
</script>

<div class="card flex flex-col items-center gap-6 p-8">
	<!-- input container -->
	<div class="relative min-w-[50vw] flex-1">
		<input
			bind:this={input_element}
			class="input"
			type="search"
			name="title"
			bind:value={search_input}
			placeholder="Search user..."
			on:focusin={() => void (input_focused = true)}
			on:keypress={simpleKeypressHandlerFactory(["Enter"], onSearchEnter)}
			autocomplete="off"
		/>
		{#if search_input && input_focused && !can_send}
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
	<!-- send button -->
	<button
		bind:this={send_button}
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
