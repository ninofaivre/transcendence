<script lang="ts">
	/* types */
	import type { Chan, Chans } from "$types"

	/* Components */
	import DiscussionDisplay from "./DiscussionDisplay.svelte"
	import CreateDiscussion from "./CreateDiscussion.svelte"
	import DiscussionList from "./DiscussionList.svelte"
	import ChatBox from "./ChatBox.svelte"
	import { onMount } from "svelte"

	// let new_message: [string, Promise<ClientInferResponses<typeof contract.chans.createChan>>]
	let new_message: [string, Promise<Response>]
	function messageSentHandler(e: CustomEvent<typeof new_message>) {
		console.log("You sent a message:", e.detail[0])
		new_message = e.detail
	}

	// Get our discussions
	export let data
	const discussions: Chan[] = data.discussions as Chan[]
	// const discussions = data.discussions // Why can't SK infer the type !?

	let currentDiscussionId: number = discussions[0]?.id

	let header_height: number

	onMount(() => {
		header_height = document.getElementById("shell-header")?.offsetHeight || 0
	})
</script>

{#if discussions.length}
	<!--Column layout -->
	<div
		class="grid grid-cols-[auto_1fr]"
		id="col_layout"
		style="height: calc(100vh - {header_height}px);"
	>
		<!-- Rows for Column 1-->
		<div
			class="grid grid-rows-[auto_1fr]"
			id="col1"
			style="height: calc(100vh - {header_height}px);"
		>
			<section class="p-4">
				<CreateDiscussion />
			</section>
			<section class="overflow-y-auto">
				<DiscussionList {discussions} bind:currentDiscussionId />
			</section>
		</div>

		<!-- Rows for Column 2-->
		<div
			class="grid grid-rows-[1fr_auto]"
			id="col2"
			style="height: calc(100vh - {header_height}px);"
		>
			<!-- Messages -->
			<DiscussionDisplay {new_message} {currentDiscussionId} />

			<!-- Input box -->
			<section class="border-t border-black p-4">
				<ChatBox on:message_sent={messageSentHandler} {currentDiscussionId} maxRows={20} />
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

<style>
</style>
