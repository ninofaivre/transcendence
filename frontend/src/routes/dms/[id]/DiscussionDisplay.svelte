<script lang="ts">
	// DiscussionDisplay.svelte

	console.log("Running DiscussionDisplay")

	import type { DirectMessageOrEvent } from "$types"

	import ChatBubble from "./ChatBubble.svelte"
	import { my_name } from "$lib/stores"
	import { onMount } from "svelte"
	import { sse_store } from "$stores"
	import { dmsClient } from "$clients"
	import { page } from "$app/stores"
	import { addEventSourceListener } from "$lib/global"
	import { get } from "svelte/store"

	export let messages: DirectMessageOrEvent[] = []
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
		const oldest_message = canary.nextElementSibling 
		const start = oldest_message?.getAttribute("id")
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

		const sse = get(sse_store)
		if (sse) {
			addEventSourceListener(sse, "CREATED_DM_ELEMENT", (data) => {
				console.log("Server message: New message", data)
				if (data?.dmId === $page.params.id) {
					messages = [...messages, data.element]
				}
			})

			addEventSourceListener(sse, "UPDATED_DM_ELEMENT", (data) => {
				console.log("Server message: Message was modified", data)
				if (data.dmId === $page.params.id) {
                    const message = data.element
					const to_update = document.getElementById(message.id)
                    if (to_update && message.type === "message") {
                        new ChatBubble({target: to_update.parentElement!, anchor: to_update, props: {message}})
                        to_update.remove()
                    }
                    // if (to_update && message.type === "message") {
                    //     const fragment = new DocumentFragment()
                    //     new ChatBubble({target: fragment as unknown as Element, props: {message, ...to_update}})
                    //     to_update.replaceWith(fragment)
                    // }
				}
			})
		} else throw new Error("sse_store is empty ! Grrrr", sse)

		_init = false
	})
</script>

<div class="flex flex-col-reverse space-y-4 overflow-y-auto p-4">
	<div bind:this={conversation_container} class="flex flex-col scroll-smooth">
		<div bind:this={canary} />
		{#each messages as message}
			{#if message.type === "message"}
				<ChatBubble {message}/>
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
