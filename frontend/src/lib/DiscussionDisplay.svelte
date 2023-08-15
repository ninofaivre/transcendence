<script lang="ts">
	// DiscussionDisplay.svelte

	import type { Chan, DirectConversation, MessageOrEvent } from "$types"

	import ChatBubble from "$lib/ChatBubble.svelte"
	import { onMount } from "svelte"
	import { my_name } from "$stores"
	import { createEventDispatcher } from "svelte"
	import { bs_hash } from "$lib/global"

	console.log("DiscussionDisplay init")

	export let discussion: Chan | DirectConversation
	export let messages: MessageOrEvent[] = []
	export let sendLoadEvents: boolean

	let observer: IntersectionObserver
	const reactivity = 1000
	const loading_greediness = 20
	let canary: HTMLDivElement
	let _init: boolean = true
	const dispatch = createEventDispatcher()

	async function intersectionHandler([entry, ..._]: IntersectionObserverEntry[]) {
		if (_init) return
		if (sendLoadEvents) {
			// console.log("intersectionHandler has been called")
			const oldest_message = canary?.nextElementSibling
			const cursor = oldest_message?.getAttribute("id")
			if (cursor && entry.isIntersecting) {
				dispatch("loadprevious", { loading_greediness, cursor, canary })
			}
		}
	}

	let conversation_container: HTMLDivElement

	onMount(() => {
		console.log("Mounting DiscussionDisplay")
		//Set up observer
		observer = new IntersectionObserver(intersectionHandler, {
			rootMargin: `${reactivity}px`,
		})
		observer.observe(canary)

		_init = false

		return () => observer.unobserve(canary)
	})
</script>

<div bind:this={conversation_container} class="flex flex-col-reverse space-y-4 overflow-y-auto p-4">
	<div class="flex flex-col scroll-smooth">
		<div bind:this={canary} id="canary" class="min-h-[1px]" />
		{#each messages as message (message.creationDate)}
			{#if message.type === "message"}
				<ChatBubble
					{discussion}
					{message}
					from_me={message.author === $my_name}
					on:delete
					on:edit
				/>
			{:else if message.type === "event"}
				<div id={message.id}>
					{#if message.eventType == "CREATED_FRIENDSHIP"}
						<div class="text-center text-gray-500">
							{`You are now friend with ${message.otherName}`}
						</div>
					{:else}
						<div class="text-center text-gray-500">
							{`${message.eventType}`}
						</div>
					{/if}
				</div>
			{/if}
		{/each}
	</div>
</div>
