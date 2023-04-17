<script lang="ts">
	import { fetchPostJSON } from "$lib/global"

	export let placeholder = "Message"

	export let discussionId: number
	let new_message: string
	let disabled = false

	async function sendMessage() {
		disabled = true

		fetchPostJSON(`/api/chans/${discussionId}/messages`, {
			content: new_message,
			relatedId: discussionId,
		})
			.then(() => {
				new_message = ""
			})
			.catch((err: any) => {
				console.error("Could not send message because: ", err.message, err)
			})

		disabled = false
	}

	// Do I really need this to handle Enter ?
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
		bind:value={new_message}
		on:keypress={handleKeypress}
		{disabled}
		{placeholder}
		class="textarea mx-auto w-full"
	/>
	<button on:click={sendMessage} class="btn variant-filled mx-2 my-auto"> Send </button>
</div>

<style>
</style>
