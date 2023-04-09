<script lang="ts">
	// DiscussionDisplay.svelte

	import type { Message } from "$lib/types"
	import type { InfiniteEvent } from "svelte-infinite-loading/types/index"

	import InfiniteLoading from "svelte-infinite-loading"
	import ChatBox from "./ChatBox.svelte"
	import ChatBubble from "./ChatBubble.svelte"
	import { fetchGet } from "$lib/global"
	import { onMount } from "svelte"

	export let my_name: string
	export let displayed_messages: Message[] // Exported so that incoming messages can be added
	export let discussionId: number // To detect change of current conversation
	$: switchMessages(discussionId)

	const initial_load = 10
	const reactivity = 10
	const switchMessages = async (_discussionId: typeof discussionId) => {
		let fetched_messages
		try {
			const response = await fetchGet("/chat/getnMessages/" + discussionId + "?n=" + initial_load)
			fetched_messages = await response.json()
		} catch (err: any) {
			// Can't type what's caught because it could catch anything
			alert("Could not fetch conversation:" + err.message + "\n Try to reload the page")
			return
		}
		if (_discussionId === discussionId) displayed_messages = fetched_messages
	}

	let loading_greediness = 2
	const api: string = "/chat/getnMessages/"

	function infiniteHandler(e: InfiniteEvent) {
		const {
			detail: { loaded, complete }
		} = e
		if (displayed_messages) {
			fetchGet(
				`${api}` +
					discussionId +
					"?" +
					"start=" +
					displayed_messages.length +
					"&" +
					"n=" +
					loading_greediness
			)
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

	let message_container: HTMLDivElement
	onMount(() => {})
</script>

<!-- The normal flexbox inside a reverse flexbox is a trick to scroll to the bottom when the element loads -->
<div class="flex flex-col-reverse space-y-4 overflow-y-auto p-4">
	<div class="flex flex-col" bind:this={message_container}>
		{#if !displayed_messages?.length}
			<p class="text-center font-semibold">This conversation has not started yet</p>
		{:else}
			<InfiniteLoading on:infinite={infiniteHandler} direction="top" distance={reactivity}>
				<!-- <div slot="noResults"></div> -->
				<!-- <div slot="noMore"></div> -->
				<div slot="error">Ooops, something went wrong when trying to fecth previous messages</div>
			</InfiniteLoading>
			{#each displayed_messages as message}
				<ChatBubble from_me={message.from === my_name} from={message.from}>
					{`${message.id}: ${message.content}`}
				</ChatBubble>
			{/each}
		{/if}
	</div>
</div>
