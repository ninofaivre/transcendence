<script lang="ts">
	// DiscussionDisplay.svelte

	console.log("Running DiscussionDisplay")

	import type { DirectMessage } from "$types"

	import ChatBubble from "./ChatBubble.svelte"
	import { my_name } from "$lib/stores"
	import { onMount } from "svelte"
	import { sse_store } from "$stores"
	import { dmsClient } from "$clients"
	import { page } from "$app/stores"
	import { addEventSourceListener } from "$lib/global"

	export let messages: DirectMessage[] = []
	// export let new_message: [string, Promise<Response>]
	export let new_message: [string, ReturnType<typeof dmsClient.createDmMessage>]
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
			let tmp: (typeof messages)[number]
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

	$: {
		handleOwnMessage(new_message)
	}

	// This should be ok as this route is only accessible to logged in users
	$: {
		if ($sse_store) {
			addEventSourceListener($sse_store, "CREATED_DM_ELEMENT", (data) => {
				console.log("Server message: New message", data)
				if (data?.dmId === $page.params.id) {
					messages = [...messages, data.element]
				}
			})

			addEventSourceListener($sse_store, "UPDATED_DM_ELEMENT", (data) => {
				console.log("Server message: Message was modified", data)
				if (data.dmId === $page.params.id) {
				}
			})
		} else console.log("$sse_store is empty ! Grrrr", sse_store, $sse_store)
	}

	_init = false

	onMount(() => {
		//Set up observer
		observer = new IntersectionObserver(intersectionHandler, {
			threshold,
			rootMargin: `${reactivity}px`,
		})
		// This causes a call to intersectionHandler to fetch messages even though oldest_message.getAttribute("id") returns nothing
		// Also this is not necessary because switchMessages handles observing
		// observer.observe(canary)
		console.log("Mounting DiscussionDisplay")
	})
</script>

<div class="flex flex-col-reverse space-y-4 overflow-y-auto p-4">
	<div class="flex flex-col scroll-smooth">
		<div bind:this={canary} />
		{#each messages as message}
			{#if message.type === "message"}
				<ChatBubble
					data_id={message.id}
					from={message.author}
					from_me={message.author === $my_name}
					is_sent={message.id !== ""}
				>
					{message.content}
				</ChatBubble>
			{:else if message.type === "event"}
				{#if message.eventType == "CREATED_FRIENDSHIP"}
					<div class="text-center text-gray-500">
						{`You are now friend with ${message.otherName}`}
					</div>
				{:else}
					<div class="text-center text-gray-500">
						{`${message.eventType}`}
					</div>
				{/if}
			{/if}
		{/each}
	</div>
</div>
