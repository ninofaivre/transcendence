<script lang="ts">
	console.log("Init ch")
	import { PUBLIC_BACKEND_URL } from "$env/static/public"
	/* types */
	import type { PageData } from "./$types"
	/* Components */
	import DiscussionDisplay from "./DiscussionDisplay.svelte"
	import CreateDiscussion from "./CreateDiscussion.svelte"
	import DiscussionList from "./DiscussionList.svelte"
	import ChatBox from "./ChatBox.svelte"
	/* stores */
	import { onDestroy, onMount } from "svelte"
	/*utils*/

	let new_message: [string, Promise<Response>]
	function messageSentHandler(e: CustomEvent<typeof new_message>) {
		console.log("You sent a message:", e.detail[0])
		new_message = e.detail
	}

	// SSE handling
	console.log("/chat/page.svelte", "Opening sse...")
	let eventSource = new EventSource(PUBLIC_BACKEND_URL + "/api/sse")
	onDestroy(() => {
		console.log("/chat/page.svelte", "Closing sse...")
		eventSource.close()
	})

	// Get our discussions
	export let data: PageData

	let currentDiscussionId: number = data.discussions[0].id
	console.log("/chat/page.svelte", "Current discussion id is :", currentDiscussionId)
</script>

{#if data.discussions.length}
	<!-- Horizontal grid -->
	<div class="grid grid-cols-[auto_1fr]" id="wrapper">
		<!-- Vertical grid 1-->
		<div class="both grid grid-rows-[1fr_auto]" id="convo">
			<section class="p-4">
				<CreateDiscussion />
			</section>
			<section class="text-red-800">
				{currentDiscussionId}
			</section>
			<section class="overflow-y-auto">
				<DiscussionList
					{eventSource}
					discussions={data.discussions}
					bind:currentDiscussionId
				/>
			</section>
		</div>

		<!-- Vertical grid 2-->
		<div class="both grid grid-rows-[1fr_auto]" id="messages">
			<!-- Messages -->
			<DiscussionDisplay {eventSource} {new_message} {currentDiscussionId} />

			<!-- Input box -->
			<section class="border-t border-black p-4">
				<ChatBox on:message_sent={messageSentHandler} {currentDiscussionId} />
			</section>
		</div>
	</div>
{:else}
	<div id="convo" class="my-10 flex h-full flex-col justify-center">
		<div class="mx-auto text-center text-3xl font-bold">
			You haven't started any conversations yet
		</div>
		<div class="mx-auto my-10">
			<CreateDiscussion />
		</div>
	</div>
{/if}

<style lang="postcss">
	#wrapper {
		height: calc(100vh - 78px);
	}

	#messages {
		height: calc(100vh - 78px);
	}

	#convo {
		height: calc(100vh - 78px);
	}
</style>
