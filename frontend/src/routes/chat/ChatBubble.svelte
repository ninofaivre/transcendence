<script lang="ts">
	import { Avatar, ProgressRadial } from "@skeletonlabs/skeleton"
	import { fade, fly, blur, crossfade, draw, slide, scale } from "svelte/transition"

	export let from = ""
	export let from_me = false
	export let sent = true
	export let data_id = -1

	from_me = false
</script>

<div
	id="message-row"
	data-id={data_id}
	style={`flex-direction: ${from_me ? "row-reverse" : "row"}`}
	class={from_me ? "space-x-2 space-x-reverse" : "space-x-2"}
>
	<div id="message-spacer" />
	<Avatar src="https://i.pravatar.cc/?img=42" width="w-8 h-8" />
	<div
		id="message-bubble"
		class={from_me ? "variant-filled-primary" : "variant-filled-secondary"}
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
					<ProgressRadial
						width="w-3"
						stroke={130}
						meter={from_me ? "stroke-secondary-600" : "stroke-tertiary-500"}
						track={from_me ? "stroke-secondary-500/30" : "stroke-tertiary-500/30"}
					/>
				</div>
			{/if}
			<div id="message-content">
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

	#from-field,
	#message-content {
		margin-left: 0.5rem;
		margin-right: 0.5rem;
	}

	#from-field {
		font-size: 0.8em;
	}

	/* To test transition */
	/* #spinner-container { */
	/* 	padding-right: 50px; */
	/* } */
</style>
