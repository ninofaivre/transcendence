<script lang="ts">
	import { Avatar, ProgressRadial } from "@skeletonlabs/skeleton"
	import { fade, fly, blur, crossfade, draw, slide, scale } from "svelte/transition"
    import type { DirectMessage } from "$types";
	import { my_name } from "$stores"

    export let message: DirectMessage;

	let from = message.author
	let from_me = ( message.author !== $my_name)
	let is_sent = ( message?.id !== "" )
	let threeDotsVisible = false
</script>

<div
    id={message.id}
	style={`flex-direction: ${from_me ? "row-reverse" : "row"}`}
	class={`message-row ${from_me ? "space-x-2 space-x-reverse" : "space-x-2"}`}
	on:mouseenter={() => (threeDotsVisible = true)}
	on:mouseleave={() => (threeDotsVisible = false)}
>
	<div class="message-spacer" />
	<Avatar src="https://i.pravatar.cc/?img=42" width="w-8 h-8" rounded="rounded-full" />
	<div
		class={`message-bubble ${from_me ? "variant-filled-primary" : "variant-filled-secondary"}`}
	>
		{#if !from_me}
			<div class="from-field font-medium">{from}</div>
		{/if}
		<div class="message-container grid grid-cols-[auto_1fr]">
			{#if !is_sent}
				<div class="spinner-container self-center" out:slide={{ axis: "x", duration: 800 }}>
					<ProgressRadial
						width="w-3"
						stroke={140}
						value={undefined}
						meter="stroke-error-500"
						track="stroke-error-500/30"
					/>
				</div>
			{/if}
			<div class="message-content">
				<slot />
			</div>
		</div>
	</div>
	<div
		on:click={() => {
			alert("Menu opened!")
		}}
		on:focus={() => {
			alert("Menu opened!")
		}}
		on:keypress={() => {
			alert("Menu opened!")
		}}
		class="menu self-center text-xl"
	>
		&#xFE19;
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

	div.menu {
		visibility: hidden;
	}

	div:hover > div.menu {
		visibility: visible;
	}

	.message-row {
		display: flex;
		margin-top: 8px;
		margin-bottom: 8px;
	}

	.message-bubble {
		max-width: 80%;
		overflow-wrap: break-word; /*So that max-width is not ignored if a word is too long*/
		border-radius: 10px;
		padding: 4px;
	}

	.from-field,
	.message-content {
		margin-left: 0.5rem;
		margin-right: 0.5rem;
	}

	.from-field {
		font-size: 0.8em;
	}

	.spinner-container {
		padding-right: 3px;
	}
</style>
