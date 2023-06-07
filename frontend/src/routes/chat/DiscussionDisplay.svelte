<script lang="ts">
	// DiscussionDisplay.svelte

	import type { ChanMessage, ChanMessages } from "$types"

	import ChatBubble from "./ChatBubble.svelte"
	import { my_name } from "$lib/stores"
	import { onMount } from "svelte"
	import { sse_store } from "$stores"
	import { chansClient } from "$clients"

	export let currentDiscussionId: number // To detect change of current conversation
	export let new_message: [string, Promise<Response>]

	let displayed_messages: ChanMessages = []
	const initial_load = 20
	let load_error: boolean
	let observer: IntersectionObserver
	const threshold = 0.5
	const reactivity = 500
	const loading_greediness = 12
	let canary: HTMLDivElement
	let _init: boolean = true

	function handleOwnMessage(_new_message: typeof new_message) {
		if (_init) return
		if (_new_message) {
			let [msg, msg_promise] = _new_message
			displayed_messages = [
				...displayed_messages,
				{
					id: -1,
					message: { content: msg, relatedTo: null, relatedRoles: [], relatedUsers: [] },
					author: $my_name,
					creationDate: new Date(),
					event: null,
				},
			]
			msg_promise.then(({ status, body }) => {
				let last_elt_index =
					displayed_messages.length > 0 ? displayed_messages.length - 1 : 0
				if (status == 201 && body) {
					displayed_messages[last_elt_index] = body as unknown as ChanMessage
				} else
					console.error(
						"The message sent was received by the server but has not been created. Server responder with:",
						status,
					)
			})
		}
	}

	async function switchMessages(_currentDiscussionId: typeof currentDiscussionId) {
		if (_init) return
		console.log("switchMessages was called ")
		if (_currentDiscussionId === currentDiscussionId) {
			load_error = false
			const { body, status } = await chansClient.getChanMessages({
				params: { chanId: currentDiscussionId.toString() },
				query: {
					nMessages: initial_load,
				},
			})
			if (status === 200) {
				displayed_messages = body
				observer.observe(canary)
			} else console.error("Could not get conversation with id:", _currentDiscussionId)
		}
	}

	async function intersectionHandler([entry, ..._]: IntersectionObserverEntry[]) {
		if (_init) return
		console.log("intersectionHandler has been called", entry)
		const oldest_message = canary.nextElementSibling
		const start = oldest_message?.getAttribute("id")
		if (start && entry.isIntersecting) {
			const { status, body } = await chansClient.getChanMessages({
				params: { chanId: currentDiscussionId.toString() },
				query: { nMessages: loading_greediness, cursor: parseInt(start) },
			})
			if (status == 200) {
				if (body.length > 0) {
					displayed_messages = [...body, ...displayed_messages]
					canary.nextElementSibling?.scrollIntoView()
				} else {
					observer.unobserve(canary)
				}
			} else {
				console.error("Couldn't load previous messages. Request returned:", status)
			}
		}
	}

	function addNewMessageFromEventSource({ data }: MessageEvent) {
		const parsedData = JSON.parse(data)
		console.log("Message received from server:", parsedData)
		displayed_messages = [...displayed_messages, parsedData]
	}

	// This should be ok since this is route is only accessible to logged_in user but
	// since the event source remains undefined until success is confirmed it needs to be reactive
	$: $sse_store?.addEventListener("CHAN_NEW_MESSAGE", addNewMessageFromEventSource)

	$: {
		handleOwnMessage(new_message)
	}

	$: {
		switchMessages(currentDiscussionId)
	}

	onMount(() => {
		//Set up observer
		observer = new IntersectionObserver(intersectionHandler, {
			threshold,
			rootMargin: `${reactivity}px`,
		})
		// This causes a call to intersectionHandler to fetch messages even though oldest_message.getAttribute("id") returns nothing
		// Also this is not necessary because switchMessages handles observing
		// observer.observe(canary)
	})

	_init = false
</script>

<!-- The normal flexbox inside a reverse flexbox is a trick to scroll to the bottom when the element loads -->
<div class="flex flex-col-reverse space-y-4 overflow-y-auto p-4">
	<div class="flex flex-col scroll-smooth">
		<div bind:this={canary} />
		{#each displayed_messages as message}
			<ChatBubble
				from_me={message.author === $my_name}
				from={message.author}
				sent={message.id < 0}
			>
				{@const data = message.message?.content}
				{#if data}
					{data}
				{:else}
					{message.event}
				{/if}
			</ChatBubble>
		{:else}
			<!-- {#if load_error} -->
			<!-- 	<p class="font-semibold text-center"> -->
			<!-- 		We encountered an error trying to retrieve this conversation's messages. Please -->
			<!-- 		check again your internet connection and refresh the page -->
			<!-- 	</p> -->
			<!-- {:else} -->
			<p class="font-semibold text-center">This conversation has not started yet</p>
			<!-- {/if} -->
		{/each}
	</div>
</div>
