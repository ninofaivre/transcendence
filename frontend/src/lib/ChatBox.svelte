<script lang="ts">
	import { createEventDispatcher, onMount } from "svelte"

	import "@skeletonlabs/skeleton/themes/theme-skeleton.css"

	export let no_outline = false
	export let minRows = 1
	export let maxRows: number | undefined = undefined
	export let line_height = 1.2
	export let placeholder = "Shift + Enter for a new line"
	export let disabled = false
	export let disabled_placeholder = "The sending of messages is disabled for the moment"
	$: placeholder = disabled ? disabled_placeholder : placeholder

	let focus_within_outline = no_outline
		? ""
		: "focus-within:outline focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-[rgba(var(--color-primary-600))] "
	const dispatch = createEventDispatcher()
	let value: string = ""
	let textarea: HTMLTextAreaElement
	// let chatbox: HTMLDivElement

	async function sendMessage() {
		value = value.trim()
		if (value) {
			dispatch("message_sent", value)
			value = ""
		}
	}

	async function handleKeypress(event: KeyboardEvent) {
		if (event.shiftKey == false) {
			switch (event.key) {
				case "Enter":
					sendMessage()
					event.preventDefault() // Prevent actual input of the newline that triggered sending
			}
		}
	}

	$: minHeight = `${1 + minRows * line_height}em`
	$: maxHeight = maxRows ? `${1 + maxRows * line_height}em` : `auto`

	onMount(() => {
		// if (no_outline) chatbox.style.setProperty("--outline", "none")
		textarea.focus()
	})
</script>

<div class="custom-radius grid min-w-[50vw] grid-cols-[1fr_auto] {focus_within_outline}">
	<div class="box">
		<pre
			aria-hidden="true"
			id="pre"
			style="min-height: {minHeight}; max-height: {maxHeight}">{value + "\n"}</pre>
		<textarea
			bind:this={textarea}
			bind:value
			class="textarea rounded-none"
			aria-label="Type your message here"
			on:keypress={handleKeypress}
			{disabled}
			{placeholder}
		/>
	</div>
	<button id="button" on:click={sendMessage} class="variant-filled-primary hover:font-medium">
		Send
	</button>
</div>

<style>
	.custom-radius {
		border-top-right-radius: 10px;
		border-bottom-right-radius: 10px;
		border-top-left-radius: 6px;
		border-bottom-left-radius: 6px;
		/* --outline: rgba(var(--color-primary-600)) solid 2px; */
	}

	/* That var comes from the skeleton theme imported above*/
	/* .custom-radius:focus-within { */
	/* 	outline: var(--outline); */
	/* 	outline-offset: 5px; */
	/* } */

	button {
		border-top-right-radius: 10px;
		border-bottom-right-radius: 10px;
		padding: 0px 5px;
	}

	.box {
		position: relative;
	}

	pre,
	textarea {
		font-family: inherit;
		padding: 0.5em;
		box-sizing: border-box;
		border: none;
		line-height: 1.2;
		overflow: hidden;
	}

	textarea {
		position: absolute;
		width: 100%;
		height: 100%;
		top: 0;
		resize: none;
		border-top-left-radius: 6px;
		border-bottom-left-radius: 6px;
	}
</style>
