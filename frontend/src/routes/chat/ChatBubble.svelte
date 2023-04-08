<script>
	export let from = ""
	export let from_me = false
	export let from_me_bg = "lightblue"
	export let from_them_bg = "lightgrey"
	export let margin = "15px"
</script>

<div class="message-row from-me-row" style={`flex-direction: ${from_me ? "row-reverse" : "row"}`}>
	<div class="message-spacer" />
	<div
		class="message-bubble text-black"
		style={`background-color: ${from_me ? from_me_bg : from_them_bg} ; ` +
			(from_me ? `margin-left: ${margin};` : `margin-right: ${margin} ;`)}
	>
		{#if !from_me}
			<div class="from-field">{from}</div>
		{/if}
		<slot />
	</div>
</div>

<style>
	.from-field {
		font-size: 0.8em;
	}

	.message-row {
		display: flex;
		margin-top: 8px;
		margin-bottom: 8px;
	}

	.message-bubble {
		overflow-wrap: break-word; /*So that max-width is not ignored max-width if a word is too long*/
		border-radius: 8px;
		padding: 4px;
	}
</style>
