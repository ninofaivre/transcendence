<script lang="ts">
	import type { DirectConversation } from "$types"
	import type { Writable } from "svelte/store"

	import { getContext, onMount } from "svelte"
	import { addListenerToEventSource } from "$lib/global"
	import { goto } from "$app/navigation"
	import { PUBLIC_BACKEND_URL } from "$env/static/public"
	import ProfilePicture from "$components/ProfilePicture.svelte"

	export let currentDiscussionId: string
	export let discussions: DirectConversation[]

	const sse_store: Writable<EventSource> = getContext("sse_store")

	onMount(() => {
		const destroyer = new Array(
			addListenerToEventSource($sse_store, "UPDATED_USER_STATUS", (data) => {
				console.log("Got a event about a dm")
				const dot_to_update = document.querySelector(
					`span[data-relatedto=${data.userName}]`,
				) as HTMLElement | null
				if (dot_to_update) {
					if (data.status === "OFFLINE") {
						// Only works if the element has a style tag onto itself !
						dot_to_update.style.visibility = "hidden"
					} else {
						dot_to_update.style.visibility = "visible"
						if (data.status === "GAME") {
							// dot_to_update.innerHTML = "&#127918" // 🎮
							dot_to_update.innerHTML = "&#127955" // 🏓
						} else if (data.status === "ONLINE" || data.status === "QUEUE") {
							dot_to_update.innerHTML = "&#8226"
						}
					}
				} else console.log("IT WAS NULL !")
			}),
		)
		return () => {
			destroyer.forEach((func: () => void) => func())
		}
	})
</script>

{#each discussions as d}
	<div
		class={`flex place-items-center rounded px-2 py-2 ${
			d.id != currentDiscussionId
				? "font-medium hover:variant-soft-secondary hover:font-semibold"
				: "variant-ghost-secondary font-semibold"
		}`}
	>
		<a href={`/dms/${d.id}`} class="flex-1 justify-self-start">
			{d.otherDisplayName}
		</a>
		<button
			class="flex justify-self-end"
			on:click={() => {
				goto(`/users/${d.otherName}`)
			}}
		>
			<ProfilePicture
				src="{PUBLIC_BACKEND_URL}/api/users/{d.otherName}/profilePicture?id={d.otherName}"
				fallback="https://i.pravatar.cc/?u={d.otherName}"
				class="h-8 w-8"
			/>
			<span
				data-relatedto={d.otherName}
				class="relative bottom-3 right-2 text-2xl text-green-600"
				style:visibility={d.otherStatus === "ONLINE" ? "visible" : "hidden"}
			>
				&#8226
			</span>
		</button>
	</div>
{/each}

<style>
	a {
		display: block;
	}
	/* a::first-letter { */
	/* 	text-transform: capitalize; */
	/* } */
</style>
