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

	// This should be ok as this route is only accessible to logged in users
	$: {
		$sse_store?.addEventListener("CREATED_DM", ({ data }: MessageEvent) => {
			const parsedData: DirectConversation = JSON.parse(data)
			console.log("Server message: New DM conversation", parsedData)
		})

		$sse_store?.addEventListener("UPDATED_DM", ({ data }: MessageEvent) => {
			const parsedData: DirectConversation = JSON.parse(data)
			console.log("Server message: Update the DM conversation", parsedData)
		})
	}
</script>

{#each discussions as d}
	{#if d.id != currentDiscussionId}
		<a
			href={`/dms/${d.id}`}
			class="p-4 font-medium rounded-container-token hover:variant-soft-secondary hover:font-semibold"
		>
			{d.otherName}
			<span class="online-dot text-2xl text-green-700">&#8226</span>
		</a>
	{:else}
		<a
			href={`/dms/${d.id}`}
			class="variant-ghost-secondary p-4 font-semibold rounded-container-token"
		>
			{d.otherName}
			<span class="online-dot text-2xl text-green-700">&#8226</span>
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
	.online-dot {
		padding: 5px;
	}
</style>
