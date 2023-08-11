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
	<a
		href={`/chans/${d.id}`}
		class={d.id != currentDiscussionId
			? "p-4 font-medium rounded-container-token hover:variant-soft-secondary hover:font-semibold"
			: "variant-ghost-secondary p-4 font-semibold rounded-container-token"}
	>
		{d.title}
		<span data-relatedto={d.id} class="online-dot text-2xl text-blue-700" /></a
	>
{/each}

<style>
	a {
		display: block;
	}
	a::first-letter {
		text-transform: capitalize;
	}
</style>
