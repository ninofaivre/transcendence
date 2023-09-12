<script lang="ts">
	import { createEventDispatcher, onMount } from "svelte"

	console.log("ChatBox init")

	export let outline = false
	export let min_rows = 1
	export let max_rows: number | undefined = undefined
	export let line_height = 1.2
	export let enabled_placeholder = "Shift + Enter for a new line"
	export let disabled = false
	export let disabled_placeholder = "The sending of messages is disabled for the moment"
	export let value: string = ""

	$: placeholder = disabled ? disabled_placeholder : enabled_placeholder

	let focus_within_outline = outline
		? "focus-within:outline focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-[rgba(var(--color-primary-600))] "
		: ""
	const dispatch = createEventDispatcher()
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

	$: min_height = `${1 + min_rows * line_height}em;`
	$: max_height = max_rows ? `${1 + max_rows * line_height}em;` : "auto;"

	onMount(() => {
		textarea.focus()
	})
</script>

<div
	data-repvalue={value + " "}
	class="
        grid
        grid-cols-[1fr_auto]
        after:invisible
        after:whitespace-pre-wrap
        after:break-all
        after:border-none
        after:content-[attr(data-repvalue)]
        after:[grid-area:1/1/2/2]
        {focus_within_outline}
    "
>
	<textarea
		style:min-height={min_height}
		style:max-height={max_height}
		bind:this={textarea}
		bind:value
		rows="1"
		{disabled}
		{placeholder}
		spellcheck="true"
		class="textarea resize-none overflow-hidden break-all [grid-area:1/1/2/2]"
		on:keypress={handleKeypress}
		aria-label="Type your message here"
	/>
	<button on:click={sendMessage} class="variant-filled-primary px-2 hover:font-medium">
		Send
	</button>
</div>

<style>
	div {
		border-top-right-radius: 11px;
		border-bottom-right-radius: 11px;
		border-top-left-radius: 7px;
		border-bottom-left-radius: 7px;
	}

	button {
		border-top-right-radius: 10px;
		border-bottom-right-radius: 10px;
		border-top-left-radius: 0px;
		border-bottom-left-radius: 0px;
	}

	textarea {
		border-top-left-radius: 6px;
		border-bottom-left-radius: 6px;
		border-top-right-radius: 0px;
		border-bottom-right-radius: 0px;
	}
</style>
