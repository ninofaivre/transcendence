<script lang="ts">
	import { PUBLIC_BACKEND_URL } from "$env/static/public"
	/* types */
	import type { Discussion as DiscussionType } from "$lib/types" // app.d.ts
	import type { PageData } from "./$types" // Generated type file
	import type { Message } from "$lib/types"
	/* Components */
	import DiscussionDisplay from "./DiscussionDisplay.svelte"
	import CreateDiscussion from "./CreateDiscussion.svelte"
	import DiscussionList from "./DiscussionList.svelte"
	import ChatBox from "./ChatBox.svelte"
	/* stores */
	import { my_name } from "$lib/stores"
	import { onMount } from "svelte"
	import { writable } from "svelte/store"

	console.log("TEST")

	// SSE handling
	let sse: EventSource
	onMount(() => {
		console.log("Opening sse...")
		sse = new EventSource(PUBLIC_BACKEND_URL + "/api/sse")
		sse.onmessage = (e: any) => {
			console.log("Message: ", e)
		}
		return () => {
			console.log("Closing sse...")
			sse.close
		}
	})

	// Get our discussions
	export let data: PageData
	let discussions: Map<number, DiscussionType>
	// Does this need to be in onMount or not ? Does it makes sense to run before component is mounted
	$: {
		discussions = new Map(
			data.discussions.map((element: DiscussionType) => [element.id, element]),
		)
		console.log("Loaded discussions: ", discussions)
	}

	let currentDiscussionID: number
</script>

{#if discussions.size}
	<!-- Horizontal grid -->
	<div class="grid grid-cols-[auto_1fr]" id="wrapper">
		<!-- Vertical grid 1-->
		<div class="both grid grid-rows-[1fr_auto]" id="convo">
			<section class="p-4">
				<CreateDiscussion />
			</section>
			<section class="overflow-y-auto">
				<DiscussionList discussions={data.discussions} bind:currentDiscussionID />
			</section>
		</div>

		<!-- Vertical grid 2-->
		<div class="both grid grid-rows-[1fr_auto]" id="messages">
			<!-- Messages -->
			<DiscussionDisplay {currentDiscussionID} />

			<!-- Input box -->
			<section class="border-t border-black p-4">
				<ChatBox {currentDiscussionID} />
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
		height: calc(100vh - 74px);
	}

	#messages {
		height: calc(100vh - 74px);
	}

	#convo {
		height: calc(100vh - 74px);
	}
</style>
