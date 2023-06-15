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
    import { appendEventSourceListener } from "$lib/global"

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
			messages = [
				...messages,
				{
					type: "message",
					message: { content, relatedTo: null },
					id: "none",
					creationDate: new Date(),
					author: $my_name,
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
            appendEventSourceListener($sse_store, "CREATED_DM_ELEMENT",  (data) => {
            console.log("Server message: New message", data)
            // if (data?.dmId != $page.params.id)
            //     console.log("... but this message is not for the current conversation", data)
		})

		$sse_store?.addEventListener("CREATED_DM_ELEMENT", ({ data }: MessageEvent) => {
			const parsedData = JSON.parse(data)
			console.log("Server message: New message", parsedData)
            if (parsedData?.dmId != $page.params.id)
                console.log("... but this message is not for the current conversation", parsedData)
		})
		$sse_store?.addEventListener("UPDATED_DM_ELEMENT", ({ data }: MessageEvent) => {
			const parsedData = JSON.parse(data)
			console.log("Server message: Update the DM message:", parsedData)
            if (parsedData?.dmId != $page.params.id)
                console.log("... but this message is not for the current conversation", parsedData)
		})

        }
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
					from_me={message.author === $my_name}
					from={message.author}
					sent={message.id ? false : message.id !== "none"}
				>
					{message.message.content}
				</ChatBubble>
			{:else if message.event.eventType == "CREATED_FRIENDSHIP"}
				<div class="text-center text-gray-500">
					<!-- Hehe this is wrong -->
					{`You are now friend with ${"Achetez cet emplacement publicitaire"}`}
				</div>
			{:else}
				<div class="text-center text-gray-500">
					{`${message.event.eventType}`}
				</div>
			{/if}
		{/each}
	</div>
</div>
