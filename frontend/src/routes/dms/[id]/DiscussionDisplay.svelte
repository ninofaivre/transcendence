<script lang="ts">
	// DiscussionDisplay.svelte

	import type { DirectMessage } from "$types"

	import ChatBubble from "./ChatBubble.svelte"
	import { my_name } from "$lib/stores"
	import { onMount } from "svelte"
	import { sse_store } from "$stores"
	import { dmsClient } from "$clients"

	export let messages: DirectMessage[] = []
	export let new_message: [string, Promise<Response>]
    export let currentDiscussionId: string

	let observer: IntersectionObserver
	const threshold = 0.5
	const reactivity = 500
	const loading_greediness = 20
	let canary: HTMLDivElement
	let _init: boolean = true

	function handleOwnMessage(_new_message: typeof new_message) {
		if (_init) return
		if (_new_message) {
			let [content, msg_promise] = _new_message
			messages = [
				...messages,
				{
                    type : "message",
                    message: { content, relatedTo: null },
                    id: "none",
                    creationDate: new Date(),
                    author: $my_name,
				},
			]
			msg_promise.then(({ status, body }) => {
				let last_elt_index =
					messages.length > 0 ? messages.length - 1 : 0
				if (status == 201 && body) {
					messages[last_elt_index] = body as unknown as DirectMessage
				} else
					console.error(
						"The message sent was received by the server but has not been created. Server responder with:",
						status,
					)
			})
		}
	}

	async function intersectionHandler([entry, ..._]: IntersectionObserverEntry[]) {
		if (_init) return
		console.log("intersectionHandler has been called", entry)
		const oldest_message = canary.nextElementSibling as HTMLElement
		const start = oldest_message?.dataset?.id
		if (start && entry.isIntersecting) {
			const { status, body } = await dmsClient.getDmElements({
				params: { dmId: currentDiscussionId.toString() },
				query: { nElements: loading_greediness, cursor: start },
			})
			if (status == 200) {
				if (body.length > 0) {
					messages = [...body, ...messages]
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
		messages = [...messages, parsedData]
	}

	// This should be ok since this is route is only accessible to logged_in user but
	// since the event source remains undefined until success is confirmed it needs to be reactive
	$: $sse_store?.addEventListener("CHAN_NEW_MESSAGE", addNewMessageFromEventSource)

	$: {
		handleOwnMessage(new_message)
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
		{#each messages as message}
			<ChatBubble
				data_id={message.id}
				from_me={message.author === $my_name}
				from={message.author}
				sent={message.id !== "none"}
			>
				{#if message.type === "message"}
					{message.message.content}
				{:else}
					{JSON.stringify(message.event)}
					<!-- {message.event} -->
				{/if}
			</ChatBubble>
		{:else}
			<p class="font-semibold text-center">This conversation has not started yet</p>
		{/each}
	</div>
</div>
