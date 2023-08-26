<script lang="ts">
	import type { Chan } from "$types"
	import { sse_store } from "$lib/stores"
	import { onMount } from "svelte"
	import { addListenerToEventSource } from "$lib/global"
	import { invalidate } from "$app/navigation"

	export let currentDiscussionId: string
	export let discussions: Chan[]

	onMount(() => {
		if ($sse_store) {
			const destroyer = new Array(
				addListenerToEventSource($sse_store, "CREATED_CHAN_ELEMENT", (data) => {
					invalidate(":chans") // Does this work ?
				}),
				addListenerToEventSource($sse_store, "UPDATED_CHAN_MESSAGE", (data) => {
					invalidate(":chans") // Does this work ?
				}),
			)
			return () => {
				destroyer.forEach((func: () => void) => func())
			}
		} else throw new Error("sse_store is empty ! Grrrr", $sse_store)
	})
</script>

{#each discussions as d}
	<div
		class={`grid grid-cols-2 rounded p-4 ${
			d.id != currentDiscussionId
				? "font-medium hover:variant-soft-secondary hover:font-semibold"
				: "variant-ghost-secondary font-semibold"
		}`}
	>
		<a href={`/chans/${d.id}`}>
			{d.title}
		</a>
		<button class="btn variant-ghost-secondary justify-self-end">👥+</button>
	</div>
{/each}

<style>
	a {
		display: block;
	}
	a::first-letter {
		text-transform: capitalize;
	}

	button {
		visibility: hidden;
	}

	div:hover > button {
		visibility: visible;
	}

	button:hover {
		font-weight: 700;
		cursor: pointer;
	}
</style>
