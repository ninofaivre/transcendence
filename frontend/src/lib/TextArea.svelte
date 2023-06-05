<script lang="ts">
	export let value = ""
	export let minRows = 1
	export let maxRows: number

	import { createEventDispatcher } from "svelte"

	const dispatch = createEventDispatcher()

	async function handleKeypress(event: KeyboardEvent) {
		if (event.shiftKey == false) {
			switch (event.key) {
				case "Enter":
					dispatch("enter", value)
			}
		}
	}

	$: minHeight = `${1 + minRows * 1.2}em`
	$: maxHeight = maxRows ? `${1 + maxRows * 1.2}em` : `auto`
</script>

<div id="container">
	<pre
		id="pre"
		aria-hidden="true"
		style="min-height: {minHeight}; max-height: {maxHeight}">{value + "\n"}</pre>

	<textarea bind:value id="textarea" class="textarea rounded-none" on:keypress={handleKeypress} />
</div>

<style>
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
