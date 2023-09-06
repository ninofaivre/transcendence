<script lang="ts">
	import type { AutocompleteOption } from "@skeletonlabs/skeleton"

	import { Autocomplete } from "@skeletonlabs/skeleton"
	import { client } from "$clients"
	import { getModalStore } from "@skeletonlabs/skeleton"
	import { onMount } from "svelte"
	import { checkError } from "./global"

	const modalStore = getModalStore()
	let search_input: string = ""
	let users: AutocompleteOption[] = []
	let input_element: HTMLElement
	let send_button: HTMLButtonElement
	let input_focused = false
    let chanId: string = $modalStore[0].meta?.chanId

	function onModalSubmit(str: string) {
		if ($modalStore[0].response) {
			$modalStore[0].response(str)
		}
	}

	function onClose() {
		if ($modalStore[0].response) {
			$modalStore[0].response(undefined)
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
                action: "CREATE_CHAN_INVITE",
                params: {
                    chanId, 
                },
				displayNameContains: input,
			},
		})
		if (ret.status != 200)
			checkError(ret, `retrieve name of users whose name contains '${input}'`)
		else users = ret.body.map((obj) => ({ label: obj.userName, value: obj.userName }))
	}

	async function onKeypress(event: KeyboardEvent) {
		if (event.shiftKey == false) {
			switch (event.key) {
				case "Enter":
					onModalSubmit(search_input)
					event.preventDefault() // Prevent actual input of the newline that triggered sending
			}
		}
	}

	$: if (search_input) getUsernames(search_input)

	onMount(() => void input_element.focus())

	let tw_rows: string
	$: tw_rows = input_focused ? "grid-rows-2" : "grid-rows-1"
</script>

<div class="card grid grid-rows-2 gap-1 p-6">
	<!-- row 1  -->
	<div class="grid min-w-[50vw] {tw_rows} gap-1">
		<!-- row 1 -->
		<input
			bind:this={input_element}
			class="input min-h-fit"
			type="search"
			bind:value={search_input}
			placeholder="Search user..."
			on:focusin={() => void (input_focused = true)}
			on:keypress={onKeypress}
		/>
		<!-- row 2 -->
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
	<!-- row 2  -->
	<footer class="modal-footer self-end">
		<button type="button" class="variant-filled-error btn" on:click={onClose}> Cancel </button>
		<button
			bind:this={send_button}
			on:click={() => {
				onModalSubmit(search_input)
			}}
			class="variant-filled-primary btn hover:font-medium"
		>
			Send invitation
		</button>
	</footer>
</div>

<style>
</style>
