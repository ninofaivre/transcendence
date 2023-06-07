<script lang="ts">
	import type { Chan } from "$types"
	import { sse_store } from "$lib/stores"

	export let currentDiscussionId: number
	export let discussions: Chan[]

	// This does not work
	async function keypressHandler(e: KeyboardEvent) {
		switch (e.code) {
			case "ArrowDown":
				console.log("Down arrow was pressed")
			case "ArrowUp":
				console.log("Up arrow was pressed")
		}
	}

	// This should be ok as this route is only accessible to logged in users
	$: {
		$sse_store?.addEventListener("CHAN_NEW_EVENT", ({ data }: MessageEvent) => {
			const parsedData: Chan = JSON.parse(data)
			console.log("Server message: New room created", parsedData)
		})

		$sse_store?.addEventListener("CHAN_NEW_MESSAGE", ({ data }: MessageEvent) => {
			const parsedData = JSON.parse(data)
			console.log("Server message: New message in for room", parsedData)
		})

		$sse_store?.addEventListener("CHAN_DELETED", ({ data }: MessageEvent) => {
			const parsedData = JSON.parse(data)
			console.log("Server message: A room was deleted", parsedData)
		})
	}
</script>

{#each discussions as d}
	{#if d.id != currentDiscussionId}
		<div
			class="hover:variant-soft-secondary p-4 font-medium rounded-container-token hover:font-semibold"
			on:click={() => (currentDiscussionId = d.id)}
			on:keypress={keypressHandler}
		>
			{d.title || d.users}
		</div>
	{:else}
		<div class="variant-ghost-secondary p-4 font-semibold rounded-container-token">
			{d.title || d.users}
		</div>
	{/if}
{/each}

<style>
	div::first-letter {
		text-transform: capitalize;
	}
</style>
