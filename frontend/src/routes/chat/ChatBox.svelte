<script lang="ts">
	import { createEventDispatcher } from "svelte"
	import { chansClient } from "$lib/clients"

	export let currentDiscussionId: number

	const dispatch = createEventDispatcher()
	let placeholder = "Enter to send\nShift + Enter for a new line"
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
		if (event.shiftKey == false) {
			switch (event.key) {
				case "Enter":
					sendMessage()
			}
		}
	}
</script>

<div class="input-group grid grid-cols-[1fr_auto] rounded-container-token">
	<label for="textarea-input" hidden> Type your message here </label>
	<textarea
		id="textarea-input"
		bind:value
		on:keypress={handleKeypress}
		{disabled}
		{placeholder}
		class="textarea border-0"
	/>
	<button on:click={sendMessage} class="variant-filled-primary"> Send </button>
</div>

<style>
</style>
