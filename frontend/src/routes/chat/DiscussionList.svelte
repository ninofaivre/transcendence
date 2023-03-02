<script lang="ts">

	export let discussions = 
	[
		{ name: "Discussion 1", users: ["alice", "bob"] },
		{ name: "Discussion 2", users: ["bob", "charlotte"] },
		{ name: "Discussion 3", users: ["alice", "charlotte"] },
	]

</script>

<h2>
	Discussions	
</h2>

{#each discussions as d}
	{#if d.name}
		<div>{d.name}</div>
	{:else}
		<div>{d.users}</div>
	{/if}
{/each}

<style>
</style>
