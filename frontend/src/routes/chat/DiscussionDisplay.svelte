<script lang="ts">
	// DiscussionDisplay.svelte

	import type { Message } from "$lib/types"

	import ChatBubble from "./ChatBubble.svelte"
	import { fetchGet } from "$lib/global"
	import { my_name } from "$lib/stores"
	import { onMount } from "svelte"

	export let currentDiscussionId: number // To detect change of current conversation
	export let new_message: [string, Promise<Response>]

	let displayed_messages: Message[] = []
	const initial_load = 20
	let load_error: boolean
	let root: HTMLDivElement
	let observer: IntersectionObserver
	const reactivity = 0
	const loading_greediness = 10
	let canary: HTMLDivElement

	function handleNewMessage(_new_message: typeof new_message) {
		if (_new_message) {
			let [msg, msg_promise] = _new_message
			// Does this preserve ordering ?
			displayed_messages = [
				...displayed_messages,
				{
					id: 0,
					message: { content: msg },
					author: $my_name,
					creationDate: new Date(),
				},
			]
			msg_promise
				.then((r: Response) => r.json())
				.catch((err: any) => {
					if (err?.status)
						console.error(
							"The message you sent was not accepted by the server: ",
							err.message,
						)
					else
						console.error(
							"The message you sent was acknowledged by the server but an error happened when parsing the confirmation. Please refresh the page: ",
							err.message,
						)
				})
				.then((m: Message) => {
					console.log("Should replace message with correct one")
					let last_elt_index =
						displayed_messages.length > 0 ? displayed_messages.length - 1 : 0
					displayed_messages[last_elt_index] = m
				})
		}
	}

	async function switchMessages(_currentDiscussionId: typeof currentDiscussionId) {
		console.log("switchMessages was called ")
		const api: string = `/api/chans/${currentDiscussionId}/messages`
		load_error = false
		let fetched_messages
		try {
			const response = await fetchGet(api, { nMessages: initial_load })
			fetched_messages = await response.json()
		} catch (err: any) {
			load_error = true
			console.log("DiscussionDisplay", fetched_messages)
			console.error("DiscussionDisplay", "Could not fetch conversation:", err.message)
			return
		}
		if (_currentDiscussionId === currentDiscussionId) displayed_messages = fetched_messages
	}

	function intersectionHandler([entry, ..._]: IntersectionObserverEntry[]) {
		console.log("intersectionHandler has been called", entry)
		let oldest_id = canary?.nextElementSibling?.getAttribute("id")
		if (oldest_id && entry.isIntersecting) {
			const api: string = `/api/chans/${currentDiscussionId}/messages`
			fetchGet(api, {
				// start: displayed_messages[0].id,
				start: oldest_id,
				nMessages: loading_greediness,
			})
				.then((response) => response.json())
				.then((fetched_messages) => {
					if (fetched_messages.length > 0) {
						displayed_messages = [...fetched_messages, ...displayed_messages]
					} else {
						observer.unobserve(canary)
					}
				})
		}
	}

	onMount(() => {
		observer = new IntersectionObserver(intersectionHandler, {
			// root,
			rootMargin: `${reactivity}px 0px 0px 0px`,
		})
		observer.observe(canary)
	})

	$: {
		handleNewMessage(new_message)
	}

	$: {
		switchMessages(currentDiscussionId)
	}
</script>

<!-- The normal flexbox inside a reverse flexbox is a trick to scroll to the bottom when the element loads -->
<div class="flex flex-col-reverse space-y-4 overflow-y-auto p-4">
	<div class="flex flex-col" bind:this={root}>
		<div bind:this={canary}>
			-----------------------------------------------------------------------
		</div>
		{#each displayed_messages as message}
			<ChatBubble
				id={message.id.toString()}
				from_me={message.author === $my_name}
				from={message.author}
			>
				{`${message.id}: ${message.message.content}`}
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
