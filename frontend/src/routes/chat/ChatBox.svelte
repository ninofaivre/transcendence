<script lang="ts">
	import { fetchPostJSON } from "$lib/global"
	import { createEventDispatcher } from "svelte"

	export let currentDiscussionId: number

	const dispatch = createEventDispatcher()
	let placeholder = "Message"
	let value: string
	let disabled = false

	async function sendMessage() {
		// disabled = true // Preventing sending two unsent messages ?

		dispatch("message_sent", value)

		fetchPostJSON(`/api/chans/${currentDiscussionId}/messages`, {
			content: value,
			// relatedId: ?,
			// usersAt: ["bob", "john"],
		})
			.then(() => {
				value = ""
			})
			.catch((err: any) => {
				console.error("Could not send message because: ", err.message, err)
			})

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
