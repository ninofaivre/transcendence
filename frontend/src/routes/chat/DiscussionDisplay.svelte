<script lang="ts">
	// DiscussionDisplay.svelte

	import type { Message } from "$lib/types"
	import type { InfiniteEvent } from "svelte-infinite-loading/types/index"

	import InfiniteLoading from "svelte-infinite-loading"
	import ChatBubble from "./ChatBubble.svelte"
	import { fetchGet } from "$lib/global"
	import { my_name } from "$lib/stores"
	import { onMount } from "svelte"

	export let currentDiscussionID: number // To detect change of current conversation

	$: switchMessages(currentDiscussionID) // this must run only when currentDiscussionID is init

	let displayed_messages: Message[] // Exported so that incoming messages can be added
	const initial_load = 10
	const reactivity = 10
	let load_error: boolean
	const switchMessages = async (_currentDiscussionID: typeof currentDiscussionID) => {
		const api: string = `/api/chans/${currentDiscussionID}/messages`
		load_error = false
		let fetched_messages
		try {
			const response = await fetchGet(api, { nMessages: initial_load })
			fetched_messages = await response.json()
		} catch (err: any) {
			load_error = true
			console.log(fetched_messages)
			console.error("Could not fetch conversation:", err.message)
			return
		}
		if (_currentDiscussionID === currentDiscussionID) displayed_messages = fetched_messages
	}

	let loading_greediness = 2
	function infiniteHandler(e: InfiniteEvent) {
		const api: string = `/api/chans/${currentDiscussionID}/messages`
		const {
			detail: { loaded, complete },
		} = e
		if (displayed_messages) {
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
	}

	// Can't remember what this is for
	let message_container: HTMLDivElement
</script>

<!-- The normal flexbox inside a reverse flexbox is a trick to scroll to the bottom when the element loads -->
<div class="flex flex-col-reverse space-y-4 overflow-y-auto p-4">
	<div class="flex flex-col" bind:this={message_container}>
		{#if !displayed_messages?.length}
			<p class="text-center font-semibold">This conversation has not started yet</p>
		{:else if load_error}
			<p class="text-center font-semibold">
				We encountered an error trying to retrieve this conversation's messages. Please try
				again later
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
