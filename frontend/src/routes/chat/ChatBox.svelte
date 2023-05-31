<script lang="ts">
	import { createEventDispatcher } from "svelte"
	import { chansClient } from "$lib/clients"

	export let currentDiscussionId: number

	const dispatch = createEventDispatcher()
	let placeholder = "Message"
	let value: string
	let disabled = false

	async function sendMessage() {
		// disabled = true // Preventing sending two unsent messages ?
		dispatch("message_sent", [
			value,
			chansClient.createChanMessage({
				params: {
					chanId: currentDiscussionId.toString(),
				},
				body: {
					content: value,
				},
			}),
		])
		value = ""
		disabled = false
	}

	async function handleKeypress(event: KeyboardEvent) {
		switch (event.key) {
			case "Enter":
				sendMessage()
		}
	}
</script>

<div class="flex">
	<label for="textarea-input" hidden class="label"> Type your message here </label>
	<textarea
		id="textarea-input"
		bind:value
		on:keypress={handleKeypress}
		{disabled}
		{placeholder}
		class="textarea mx-auto w-full"
	/>
	<button on:click={sendMessage} class="btn variant-filled mx-2 my-auto"> Send </button>
</div>

<style>
</style>
