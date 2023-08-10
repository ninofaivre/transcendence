<script lang="ts">
	import type { DirectConversation } from "$types"
	import { sse_store } from "$lib/stores"
	import { onMount } from "svelte"
	import { addListenerToEventSource } from "$lib/global"
	import { invalidate } from "$app/navigation"

	export let currentDiscussionId: string
	export let discussions: DirectConversation[]

	onMount(() => {
		if ($sse_store) {
			const destroyer = new Array(
				addListenerToEventSource($sse_store, "CREATED_CHAN", (data) => {
					console.log("A new chan was created!")
					invalidate(":discussions") // Does this work ?
				}),
				addListenerToEventSource($sse_store, "UPDATED_USER_STATUS", (data) => {
					console.log("Got a event about a chan")
					const dot_to_update = document.querySelector(
						`span.online-dot[data-relatedto=${data.userName}]`,
					) as HTMLElement
					if (dot_to_update) {
						console.log(`${data.userName} is now ${data.status} !`)
						if (data.status !== "ONLINE") {
							// Only works if the element has a style tag onto itself
							dot_to_update.style.visibility = "hidden"
						} else {
							dot_to_update.style.visibility = "visible"
						}
					} else console.log("IT WAS NULL !")
				}),
				addListenerToEventSource($sse_store, "UPDATED_CHAN_MESSAGE", (data) => {
					// Mark unread the discussion that corresponds to the discussion who got a new message
					// How to I differentiate a modified message from a new message
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
