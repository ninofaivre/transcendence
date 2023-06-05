<script lang="ts">
	export let from = ""
	export let from_me = false
	export let from_me_bg = "lightblue"
	export let from_them_bg = "lightgrey"
	export let margin = "15px"
	export let id: string
	export let sent = true
</script>

<div {id} class="message-row" style={`flex-direction: ${from_me ? "row-reverse" : "row"}`}>
	<div class="message-spacer" />
	<div
		class="message-bubble text-primary-800"
		style={`background-color: ${from_me ? from_me_bg : from_them_bg} ; ` +
			(from_me ? `margin-left: ${margin};` : `margin-right: ${margin} ;`)}
	>
		{#if !from_me}
			<div id="from-field">{from}</div>
		{/if}
		<div class="flex">
			{#if sent}
				<div id="spinner" />
			{/if}
			<slot />
		</div>
	</div>
</div>

<style>
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

	#spinner {
		height: 0.6em;
		width: 0.6em;
		border: 2px solid;
		border-radius: 50%;
		border-top-color: transparent;
		border-bottom-color: transparent;
		align-self: center;
		margin-left: 5px;
		margin-right: 8px;
		animation: spin 0.8s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	#from-field {
		font-size: 0.8em;
	}
</style>
