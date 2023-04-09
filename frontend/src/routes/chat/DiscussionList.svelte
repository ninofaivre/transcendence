<script lang="ts">
	import type { Discussion } from "$lib/types"

	export let curr_disc_idx = 0

	export let discussions: Discussion[]
</script>

{#each discussions as d (d.id)}
	{#if d.id - 1 != curr_disc_idx}
		<div class="p-4 font-bold" on:click={() => (curr_disc_idx = d.id - 1)}>
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
