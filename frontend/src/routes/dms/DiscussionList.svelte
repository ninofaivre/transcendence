<script lang="ts">
	import type { DirectConversation } from "$types"
	import { sse_store } from "$lib/stores"
	import { page } from "$app/stores"
	import { onMount } from "svelte"
	import { addEventSourceListener } from "$lib/global"
	import { invalidate, invalidateAll } from "$app/navigation"

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

	onMount(() => {
		if ($sse_store) {
			const destroyer = new Array(
				addEventSourceListener($sse_store, "CREATED_DM", (data) => {
					console.log("A new dm was created!")
					invalidate(":discussions")
				}),
				addEventSourceListener($sse_store, "UPDATED_DM", (data) => {
					console.log("Got a event about a dm")
					// invalidate(":discussions")
					// invalidateAll()
					const dot_to_update = document.querySelector(
						`span.online-dot[data-relatedto=${data.otherName}]`,
					) as HTMLElement
					if (dot_to_update) {
						console.log(`${data.otherName} is now ${data.otherStatus} !`)
						if (data.otherStatus !== "ONLINE") {
							// Only works if the element has a style tag onto itself
							dot_to_update.style.visibility = "hidden"
						} else {
							dot_to_update.style.visibility = "visible"
						}
					} else console.log("IT WAS NULL !")
				}),
			)
			return () => {
				destroyer.forEach((func: () => any) => func())
			}
		} else throw new Error("sse_store is empty ! Grrrr", $sse_store)
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
		<span
			data-relatedto={d.otherName}
			class="online-dot text-2xl text-green-700"
			style:visibility={d.otherStatus === "ONLINE" ? "visible" : "hidden"}>&#8226</span
		>
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
