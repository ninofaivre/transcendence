<script lang="ts">
	// DiscussionDisplay.svelte

	import type { Message } from "$lib/types"
	import type { InfiniteEvent } from "svelte-infinite-loading/types/index"

	import InfiniteLoading from "svelte-infinite-loading"
	import ChatBubble from "./ChatBubble.svelte"
	import { fetchGet } from "$lib/global"
	import { my_name } from "$lib/stores"

	export let currentDiscussionId: number // To detect change of current conversation
	export let new_message: [string, Promise<Response>]

	let displayed_messages: Message[] = []

	const initial_load = 10
	let load_error: boolean
	async function switchMessages(_currentDiscussionId: typeof currentDiscussionId) {
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

	const reactivity = 1
	const loading_greediness = 10
	function infiniteHandler(e: InfiniteEvent) {
		const api: string = `/api/chans/${currentDiscussionId}/messages`
		const {
			detail: { loaded, complete },
		} = e
		fetchGet(api, {
			start: displayed_messages[0].id,
			nMessages: loading_greediness,
		})
			.then((response) => response.json())
			.then((fetched_messages) => {
				if (fetched_messages.length > 0) {
					displayed_messages = [...fetched_messages, ...displayed_messages]
					loaded()
				} else {
					complete()
				}
			})
	}

	$: {
		switchMessages(currentDiscussionId)
	}

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

	$: {
		handleNewMessage(new_message)
	}
</script>

<!-- The normal flexbox inside a reverse flexbox is a trick to scroll to the bottom when the element loads -->
<div class="flex flex-col-reverse space-y-4 overflow-y-auto p-4">
	<div class="flex flex-col">
		{#if !displayed_messages?.length}
			<p class="text-center font-semibold">This conversation has not started yet</p>
		{:else if load_error}
			<p class="text-center font-semibold">
				We encountered an error trying to retrieve this conversation's messages. Please
				check again your internet connection and refresh the page
			</p>
		{:else}
			<InfiniteLoading on:infinite={infiniteHandler} direction="top" distance={reactivity}>
				<!-- <div slot="noResults"></div> -->
				<!-- <div slot="noMore"></div> -->
				<div slot="error">
					Ooops, something went wrong when trying to fecth previous messages
				</div>
			</InfiniteLoading>
			{#each displayed_messages as message}
				<ChatBubble from_me={message.author === $my_name} from={message.author}>
					{`${message.id}: ${message.message.content}`}
				</ChatBubble>
			{/each}
		{/if}
	</div>
</div>
