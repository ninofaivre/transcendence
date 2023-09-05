<script lang="ts">
	// DiscussionDisplay.svelte

	import type { Chan, DirectConversation, GameSocket, MessageOrEvent } from "$types"
	import type { Writable } from "svelte/store"

	import ChatBubble from "$lib/ChatBubble.svelte"
	import { getContext, onMount } from "svelte"
	import { createEventDispatcher } from "svelte"

	console.log("DiscussionDisplay init")

	export let discussion: Chan | DirectConversation 
	export let messages: MessageOrEvent[] = []
	export let sendLoadEvents: boolean
	export let my_name: string

	let observer: IntersectionObserver
	const reactivity = 1000
	const loading_greediness = 20
	let canary: HTMLDivElement
	let _init: boolean = true
	const dispatch = createEventDispatcher()
	let game_socket: Writable<GameSocket> = getContext("game_socket")

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
					from_me={message.author === my_name}
					on:delete
					on:edit
					{game_socket}
				/>
			{:else if message.type === "event"}
				<div id={message.id}>
					{#if message.eventType == "CREATED_FRIENDSHIP"}
						<div class="text-center text-gray-500">
							{`You are now friend with ${message.otherName}`}
						</div>
					{:else if message.eventType == "BLOCKED"}
						<div class="text-center text-gray-500">
							{`${message.blockingUserName} blocked ${message.blockedUserName}`}
						</div>
					{:else if message.eventType == "AUTHOR_LEAVED"}
						<div class="text-center text-gray-500">
							{`${message.author} left chan`}
						</div>
					{:else if message.eventType == "AUTHOR_JOINED"}
                        <div class="text-center text-gray-500">
							{`${message.author} joined the chan`}
						</div>
					{:else if message.eventType == "CHAN_INVITATION"}
                        <div class="text-center text-gray-500">
						</div>
					{:else if message.eventType == "DELETED_FRIENDSHIP"}
                        <div class="text-center text-gray-500">
							{`You are no longer friend with ${message.otherName}`}
						</div>
					{:else if message.eventType == "AUTHOR_MUTED_CONCERNED"}
                        {#if message.timeoutInMs === 'infinity'}
                            <div class="text-center text-gray-500">
                                {`${message.author} muted ${message.concernedUserName} until further notice`}
                            </div>
                        {:else}
                            <div class="text-center text-gray-500">
                                {`${message.author} muted ${message.concernedUserName} for ${ message.timeoutInMs / 1000}`}
                            </div>
                        {/if}
					{:else if message.eventType == "AUTHOR_KICKED_CONCERNED"}
                        <div class="text-center text-gray-500">
							{`${message.author} kicked ${message.concernedUserName}`}
						</div>
					{:else}
						<div class="text-center text-gray-500">
						</div>
					{/if}
				</div>
			{/if}
		{/each}
	</div>
</div>
