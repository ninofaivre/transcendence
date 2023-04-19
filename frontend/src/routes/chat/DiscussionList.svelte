<script lang="ts">
	import type { Discussion } from "$lib/types"

	export let currentDiscussionId: number

	export let discussions: Discussion[]

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
		<div
			class="p-4 font-bold"
			on:click={() => (currentDiscussionId = d.id)}
			on:keypress={keypressHandler}
		>
			{d.title || d.users}
		</div>
	{:else}
		<div class="variant-form-material h-16 p-4 font-bold">
			{d.title || d.users}
		</div>
	{/if}
{/each}

<style>
	div::first-letter {
		text-transform: capitalize;
	}
</style>
