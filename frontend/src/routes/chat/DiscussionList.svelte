<script lang="ts">
	import type { DirectConversation } from "$types"
	import { sse_store } from "$lib/stores"

	export let currentDiscussionId: string
	export let discussions: DirectConversation[]

	// This does not work
	async function keypressHandler(e: KeyboardEvent) {
		switch (e.code) {
			case "ArrowDown":
				console.log("Down arrow was pressed")
			case "ArrowUp":
				console.log("Up arrow was pressed")
		}
	}
</script>

{#each discussions as d}
	{#if d.id != currentDiscussionId}
		<a
			href={`/dms/${d.id}`}
			class="p-4 font-medium rounded-container-token hover:variant-soft-secondary hover:font-semibold"
		>
			{d.otherName}
		</a>
	{:else}
		<a
			href={`/dms/${d.id}`}
			class="variant-ghost-secondary p-4 font-semibold rounded-container-token"
		>
			{d.otherName}
		</a>
	{/if}
{/each}

<style>
	a {
		display: block;
	}
	a::first-letter {
		text-transform: capitalize;
	}
</style>
