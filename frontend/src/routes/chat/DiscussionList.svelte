<script lang="ts">

	import type { Discussion } from '$types'
	import CreateDiscussion from './CreateDiscussion.svelte'

	export let curr_disc_idx = 0

	export let discussions: Discussion[]

</script>

<h2>
	Discussions	
</h2>

{#each discussions as d (d.id)}
	{#if d.id - 1 != curr_disc_idx }
		<button
		  on:click={ () => curr_disc_idx = d.id - 1}
		  on:keyup={ () => { if (curr_disc_idx > 0) curr_disc_idx-- } }
		  on:keydown={ () => { if (curr_disc_idx < discussions.length) curr_disc_idx++ } }
		>
			{ d.title || d.users }
		</button>
	{:else}
		<button style:background-color="red"> { d.title || d.users } </button>
	{/if}
{/each}

<style>
</style>
