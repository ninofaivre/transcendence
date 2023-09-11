<script lang="ts">

	import { onMount } from "svelte"
	import { client } from "$clients"
	import { getModalStore, getToastStore } from "@skeletonlabs/skeleton"
	import { simpleKeypressHandlerFactory } from "./global"
	import { isContractError } from "contract"

	const modalStore = getModalStore()
	let search_input: string = ""
    let blacklist: string[]
	let input_element: HTMLElement
	let send_button: HTMLButtonElement
	let input_focused = false
	let can_send: boolean = false

	async function sendBackData() {

		if ($modalStore[0].response) {
			$modalStore[0].response(search_input)
		}
	}

	async function getUserList(input: string) {
		return client.users
			.searchUsersV2({
                query: {
                    params: {},
                    action: "*",
                    displayNameContains: input,
                }
			})
			.then((ret) => {
				if (ret.status !== 200) {
					checkError(ret, "get room list")
				} else {
					blacklist = ret.body.map((obj) => (obj.displayName))
				}
			})
	}

	function onSearchEnter() {
		send_button.focus()
	}

	$: if (search_input) getUserList(search_input)

	$: {
		if (blacklist.find((el) => el === search_input)) {
			can_send = false
		}
        else can_send = true
	}

	onMount(() => void input_element.focus())

	const toastStore = getToastStore()
	function makeToast(message: string) {
		if (toastStore)
			toastStore.trigger({
				message,
			})
	}
	function checkError(ret: { status: number; body: any }, what: string) {
		if (isContractError(ret)) {
			makeToast("Could not " + what + " : " + ret.body.message)
			console.log(ret.body.code)
		} else {
			let msg = "Server return unexpected status " + ret.status
			if ("message" in ret.body) msg += " with message " + ret.body.message
			makeToast(msg)
			console.error(msg)
		}
	}
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
	</div>
    <sub class="text-red-500">
        {#if !can_send}
            User name already taken
        {/if}
    </sub>
	<!-- send button -->
	<button
		bind:this={send_button}
		type="submit"
		class="variant-filled-primary btn w-fit justify-self-center px-12"
		disabled={!can_send}
		on:click={sendBackData}
		on:keypress={simpleKeypressHandlerFactory(["Enter"], sendBackData)}
	>
		Confirm
	</button>
</div>

<style>
	input {
		border-radius: 15px;
	}
</style>
