<script lang="ts">
	import type { DirectConversation } from "$types"
	import { sse_store } from "$lib/stores"
	import { page } from "$app/stores"
	import { onMount } from "svelte"
	import { get } from "svelte/store"
	import { addEventSourceListener } from "$lib/global"
	import { invalidate } from "$app/navigation"

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

	onMount(() => {
		const sse = get(sse_store)
		if (sse) {
			const destroyer = new Array(
				addEventSourceListener(sse, "CREATED_DM", (data) => {
					console.log("A new dm was created!")
					invalidate(":discussions")
				}),
				addEventSourceListener(sse, "UPDATED_DM", (data) => {
					console.log("a dm was updated ???")
					invalidate(":discussions")
					const dot_to_update = document.querySelector(
						`.online-dot[data-relatedto=${data.otherName}]`,
					) as HTMLElement
					console.log(dot_to_update)
					if (dot_to_update) {
						if (data.otherStatus !== "ONLINE") dot_to_update.style.display = "none"
						else dot_to_update.style.display = "inline"
					}
				}),
			)
			return () => {
				destroyer.forEach((func: () => any) => func())
			}
		} else throw new Error("sse_store is empty ! Grrrr", sse)
	})
</script>

{#each discussions as d}
	<a
		href={`/dms/${d.id}`}
		class={d.id != currentDiscussionId
			? "p-4 font-medium rounded-container-token hover:variant-soft-secondary hover:font-semibold"
			: "variant-ghost-secondary p-4 font-semibold rounded-container-token"}
	>
		{d.otherName}
		{#if d.otherStatus === "ONLINE"}
			<span data-relatedto={d.otherName} class="online-dot text-2xl text-green-700"
				>&#8226</span
			>
		{/if}
	</a>
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
