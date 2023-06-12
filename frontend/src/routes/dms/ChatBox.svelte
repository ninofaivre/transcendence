<script lang="ts">
	import { createEventDispatcher } from "svelte"
	import { chansClient } from "$lib/clients"

	import "@skeletonlabs/skeleton/themes/theme-skeleton.css"

	export let currentDiscussionId: string
	export let minRows = 1
	export let maxRows: number | undefined
	export let disabled = false
	export let line_height = 1.2

	const dispatch = createEventDispatcher()
	let placeholder = "Shift + Enter for a new line"
	let value: string = ""

	async function sendMessage() {
		value = value.trim()
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
					event.preventDefault() // Prevent news line from being entered in the textarea
			}
		}
	}

	$: minHeight = `${1 + minRows * line_height}em`
	$: maxHeight = maxRows ? `${1 + maxRows * line_height}em` : `auto`
</script>

<div id="grid" class="grid grid-cols-[1fr_auto]">
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
	<button id="button" on:click={sendMessage} class="variant-filled-primary hover:font-medium">
		Send
	</button>
</div>

<style>
	#grid {
		border-top-right-radius: 10px;
		border-bottom-right-radius: 10px;
		border-top-left-radius: 6px;
		border-bottom-left-radius: 6px;
	}

	/* That var comes from the skeleton theme imported above*/
	#grid:focus-within {
		/* box-shadow: 0px 0px 0px 1px rgba(var(--color-primary-500)); */
		outline: rgba(var(--color-primary-600)) solid 2px;
		outline-offset: 5px;
	}

	#button {
		border-top-right-radius: 10px;
		border-bottom-right-radius: 10px;
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
		border-top-left-radius: 6px;
		border-bottom-left-radius: 6px;
	}
</style>
