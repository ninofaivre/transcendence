<script lang="ts">
	import { createEventDispatcher } from "svelte"
	import { chansClient } from "$lib/clients"

	export let currentDiscussionId: number
	export let minRows = 1
	export let maxRows: number | undefined
	export let disabled = false

	const dispatch = createEventDispatcher()
	let placeholder = "Shift + Enter for a new line"
	let value: string

	async function sendMessage() {
		if (value) {
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
		}
	}

	async function handleKeypress(event: KeyboardEvent) {
		if (event.shiftKey == false) {
			switch (event.key) {
				case "Enter":
					sendMessage()
			}
		}
	}

	$: minHeight = `${1 + minRows * 1.2}em`
	$: maxHeight = maxRows ? `${1 + maxRows * 1.2}em` : `auto`
</script>

<div class="grid grid-cols-[1fr_auto]">
	<div id="container">
		<pre
			aria-hidden="true"
			id="pre"
			style="min-height: {minHeight}; max-height: {maxHeight}">{value + "\n"}</pre>
		<textarea
			bind:value
			id="textarea"
			class="textarea rounded-none"
			aria-label="Type your message here"
			on:keypress={handleKeypress}
			{placeholder}
			{disabled}
		/>
	</div>
	<button id="button" on:click={sendMessage} class="variant-filled-primary"> Send </button>
</div>

<style>
	#button {
		border-top-right-radius: 10px;
		border-bottom-right-radius: 10px;
		margin: 0px;
		border-radius: none;
		border-left: solid 1px green;
		padding: 0px 5px;
	}

	#container {
		position: relative;
	}

	#pre,
	#textarea {
		font-family: inherit;
		padding: 0.5em;
		box-sizing: border-box;
		border: none;
		line-height: 1.2;
		overflow: hidden;
	}

	#textarea {
		position: absolute;
		width: 100%;
		height: 100%;
		top: 0;
		resize: none;
		border-top-left-radius: 10px;
		border-bottom-left-radius: 10px;
	}
</style>
