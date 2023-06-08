<script lang="ts">
	import { ProgressRadial } from "@skeletonlabs/skeleton"
	import { fade, fly, blur, crossfade, draw, slide, scale } from "svelte/transition"

	export let from = ""
	export let from_me = false
	export let from_me_bg = "lightblue"
	export let from_them_bg = "lightgrey"
	export let margin = "15px"
	export let sent = true
	export let data_id = -1
</script>

<div
	id="message-row"
	data-id={data_id}
	style={`flex-direction: ${from_me ? "row-reverse" : "row"}`}
>
	<div id="message-spacer" />
	<div
		id="message-bubble"
		class="text-black"
		style={`background-color: ${from_me ? from_me_bg : from_them_bg} ; ` +
			(from_me ? `margin-left: ${margin};` : `margin-right: ${margin} ;`)}
	>
		{#if !from_me}
			<div id="from-field">{from}</div>
		{/if}
		<div id="message-container" class="grid grid-cols-[auto_1fr]">
			{#if sent}
				<div
					id="spinner-container"
					class="self-center"
					out:slide={{ axis: "x", duration: 800 }}
				>
					<!-- out:scale={{ duration: 600 }} -->
					<ProgressRadial
						width="w-3"
						stroke={130}
						meter="stroke-primary-600"
						track="stroke-primary-500/30"
					/>
				</div>
			{/if}
			<div id="message-content" class="mx-2">
				<slot />
			</div>
		</div>
	</div>
</div>

<style>
	/* Does not work  when element is removed*/
	/* #message-container { */
	/* 	transition: 1s ease-in-out; */
	/* } */

	/**
	 * Applies to slotted element. Don't do nothing if it's just text inside. (No child)
	 */
	/* #message-container :global(> :last-child) { */
	/* } */

	#message-row {
		display: flex;
		margin-top: 8px;
		margin-bottom: 8px;
	}

	#message-bubble {
		overflow-wrap: break-word; /*So that max-width is not ignored max-width if a word is too long*/
		border-radius: 8px;
		padding: 4px;
	}

	#from-field {
		font-size: 0.8em;
	}

	/* To test transition */
	/* #spinner-container { */
	/* 	padding-right: 50px; */
	/* } */
</style>
