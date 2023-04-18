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
	import { onDestroy } from "svelte"
	/* sse */
	import { sse } from "$lib/sse"

	export let data: PageData

	let discussions: DiscussionType[]
	$: discussions = Object.values(data.discussions)

	let idx = 0
	$: discussionId = idx + 1
	let all_messages: Message[][] = []

	onDestroy(() => {
		sse.close()
	})

	sse.onmessage = ({ data }) => {
		const parsedData = JSON.parse(data)
		const new_discussions = parsedData.test.discussions
		const new_messages = parsedData.test.messages
		if (!new_discussions?.length && !new_messages?.length) return
		if (new_discussions?.length) {
			console.log("A new discussion was created")
			for (let d of new_discussions) {
				discussions = [...discussions, d]
				all_messages[d.discussionId - 1] = []
			}
		}
		if (new_messages?.length) {
			console.log("Got a new message !", new_messages)
			for (let msg of new_messages) {
				let i = msg.discussionId - 1
				all_messages[i] = [...all_messages[i], msg]
			}
		}
	}
</script>

{#if discussions.length}
	<!-- Horizontal grid -->
	<div class="grid grid-cols-[auto_1fr]" id="wrapper">
		<!-- Vertical grid 1-->
		<div class="both grid grid-rows-[1fr_auto]" id="convo">
			<section class="p-4">
				<CreateDiscussion />
			</section>
			<section class="overflow-y-auto">
				<DiscussionList {discussions} bind:curr_disc_idx={idx} />
			</section>
		</div>

		<!-- Vertical grid 2-->
		<div class="both grid grid-rows-[1fr_auto]" id="messages">
			<!-- Messages -->
			<DiscussionDisplay
				bind:displayed_messages={all_messages[idx]}
				{discussionId}
				my_name={$my_name}
			/>

			<!-- Input box -->
			<section class="border-t border-black p-4">
				<ChatBox {discussionId} />
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
