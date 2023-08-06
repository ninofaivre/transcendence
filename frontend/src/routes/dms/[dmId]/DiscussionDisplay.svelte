<script lang="ts">
	// DiscussionDisplay.svelte

	import type { CreateMessageFunction, MessageOrEvent } from "$types"

	import ChatBubble from "./ChatBubble.svelte"
	import { onMount } from "svelte"
	import { client } from "$clients"
	import { my_name } from "$stores"
	import { createEventDispatcher } from "svelte"
	import { bs_hash } from "$lib/global"

	export let messages: MessageOrEvent[] = []
	// export let new_message: [string, Promise<Response>]
	export let new_message: [string, ReturnType<CreateMessageFunction>]
	export let sendLoadEvents: boolean

	let observer: IntersectionObserver
	const threshold = 0.5
	const reactivity = 500
	const loading_greediness = 20
	let canary: HTMLDivElement
	let _init: boolean = true
	const dispatch = createEventDispatcher()

	function handleOwnMessage(_new_message: typeof new_message) {
		if (_init) return
		conversation_container.scrollTop = conversation_container.scrollHeight
		if (_new_message) {
			let [content, msg_promise] = _new_message
			messages = [
				...messages,
				{
					type: "message",
					id: "",
					content,
					creationDate: new Date(),
					author: $my_name,
					hasBeenEdited: false,
					relatedTo: null,
					isDeleted: false,
				},
			]
			msg_promise.then(({ status, body }) => {
				let last_elt_index = messages.length > 0 ? messages.length - 1 : 0
				if (status == 201 && body) {
					messages[last_elt_index] = body
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
		if (sendLoadEvents) {
			console.log("intersectionHandler has been called", entry)
			const oldest_message = canary?.nextElementSibling
			const cursor = oldest_message?.getAttribute("id")
			if (cursor && entry.isIntersecting) {
				dispatch("loadprevious", { loading_greediness, cursor, canary })
			}
		}
	}

	let conversation_container: HTMLDivElement

	$: {
		handleOwnMessage(new_message)
	}

	onMount(() => {
		console.log("Mounting DiscussionDisplay")
		//Set up observer
		observer = new IntersectionObserver(intersectionHandler, {
			threshold,
			rootMargin: `${reactivity}px`,
		})
		observer.observe(canary)

		_init = false
	})

	$: {
		if (sendLoadEvents == false) observer.unobserve(canary)
	}
</script>

<div bind:this={conversation_container} class="flex flex-col-reverse space-y-4 overflow-y-auto p-4">
	<div class="flex flex-col scroll-smooth">
		<div bind:this={canary} />
		{#each messages as message}
			{#if message.type === "message"}
				<ChatBubble
					{message}
					avatar_src="https://i.pravatar.cc/?img={bs_hash(message.author)}"
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
