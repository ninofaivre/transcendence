<script lang="ts">
	import Autocomplete from "$lib/Autocomplete.svelte"
	import type { AutocompleteOption } from "@skeletonlabs/skeleton"

	import { onMount } from "svelte"
	import { client } from "$clients"
	import { getModalStore } from "@skeletonlabs/skeleton"
	import { checkError } from "./global"

	const modalStore = getModalStore()
	let search_input: string = ""
	let users: AutocompleteOption[] = []
	let input_element: HTMLElement
	let send_button: HTMLButtonElement
	let input_focused = false
	let border_radius = "15px"

	async function sendBackUsername(username: string) {
		if ($modalStore[0].response) {
			$modalStore[0].response(username)
		}
	}

	async function onUserSelection(event: any) {
		search_input = event.detail.label
		input_focused = false
		send_button.focus()
	}

	async function getUsernames(input: string) {
		return client.users
			.searchUsersV2({
				query: {
                    params: {},
					userNameContains: input,
                    action: "CREATE_FRIEND_INVITE",
				},
			})
			.then((ret) => {
				if (ret.status !== 200) {
					checkError(ret, "get users' names")
				} else {
					users = ret.body.map((obj) => ({ label: obj.userName, value: obj.userName }))
				}
			})
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
			class="variant-filled-primary hover:font-medium"
			style="--border-radius-var: {border_radius}"
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
		border-top-right-radius: var(--border-radius-var);
		border-bottom-right-radius: var(--border-radius-var);
		/* top | right | bottom | left */
		padding: 0px 8px 0px 5px;
	}
</style>
