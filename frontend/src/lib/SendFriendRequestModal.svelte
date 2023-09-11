<script lang="ts">
	import Autocomplete from "$lib/Autocomplete.svelte"
	import type { AutocompleteOption } from "@skeletonlabs/skeleton"

	import { onMount } from "svelte"
	import { client } from "$clients"
	import { getModalStore } from "@skeletonlabs/skeleton"

	const modalStore = getModalStore()
	const checkError: (ret: { status: number; body: any }, what: string) => void =
		(window as any).checkError
	let search_input: string = ""
	let users: AutocompleteOption[] = []
	let input_element: HTMLElement
	let send_button: HTMLButtonElement
	let input_focused = false
	let border_radius = "15px"

	async function sendBackUsername(input: string) {
		const invitedUserName = users.find((el) => input === el.label)?.value

		if ($modalStore[0].response) {
			$modalStore[0].response(invitedUserName)
		}
	}

	async function onUserSelection(event: any) {
		search_input = event.detail.label
		input_focused = false
		send_button.focus()
	}

	async function getUsernames(input: string) {
		const ret = await client.users.searchUsersV2({
			query: {
				params: {},
				displayNameContains: input,
				action: "CREATE_FRIEND_INVITE",
			},
		})
		if (ret.status !== 200) checkError(ret, "get user names")
		else users = ret.body.map((obj) => ({ label: obj.displayName, value: obj.userName }))
	}

	let can_send: boolean = false
	$: {
		if (!users.find((el) => el.label === search_input)) {
			can_send = false
		} else can_send = true
	}

	async function onKeypress(event: KeyboardEvent) {
		if (event.shiftKey == false) {
			switch (event.key) {
				case "Enter":
					sendBackUsername(search_input)
					event.preventDefault() // Prevent actual input of the newline that triggered sending
					search_input = ""
			}
		}
	}

	$: if (search_input) getUsernames(search_input)

	onMount(() => void input_element.focus())
</script>

<div class="card grid grid-rows-2 gap-1 p-8">
	<div class="grid h-fit min-w-[50vw] grid-cols-[1fr_auto]">
		<input
			bind:this={input_element}
			class="input py-2"
			type="search"
			bind:value={search_input}
			placeholder="Search user..."
			on:focusin={() => void (input_focused = true)}
			on:keypress={onKeypress}
			style="--border-radius-var: {border_radius}"
		/>
		<button
			bind:this={send_button}
			on:click={() => {
				sendBackUsername(search_input)
				search_input = ""
			}}
			class="variant-filled-primary btn hover:font-medium disabled:font-normal"
			style="--border-radius-var: {border_radius}"
			disabled={!can_send}
		>
			Send
		</button>
	</div>
	{#if input_focused}
		<div class="card my-2 max-h-48 w-full overflow-y-auto p-2" tabindex="-1">
			<Autocomplete
				options={users}
				on:selection={onUserSelection}
				regionButton="w-full btn-md"
			/>
		</div>
	{/if}
</div>

<style>
	input {
		border-radius: var(--border-radius-var) 0px 0px var(--border-radius-var);
	}

	button {
		border-top-left-radius: var(--border-radius-var);
		border-bottom-left-radius: var(--border-radius-var);
		/* top | right | bottom | left */
		padding: 0px 8px 0px 5px;
	}
</style>
