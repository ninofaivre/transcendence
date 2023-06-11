<script lang="ts">
	/* types */
	import type { Chan } from "$types"

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

	let currentDiscussionId: string = discussions[0]?.id

	let header: HTMLElement | null
	let header_height: number

	onMount(() => {
		header = document.getElementById("shell-header")
		if (header) {
			header_height = header.offsetHeight || 0

			const resizeObserver = new ResizeObserver((entries) => {
				// We're only watching one element
				const new_height = entries.at(0)?.contentRect.height
				if (new_height && new_height !== header_height) {
					header_height = new_height
				}
			})

			resizeObserver.observe(header)
			// This callback cleans up the observer
			return () => resizeObserver.unobserve(header as HTMLElement)
		}
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
				<CreateDiscussion friendList={data.friendList}/>
			</section>
			<section id="discussions" class="overflow-y-auto">
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
			<section id="input-row" class="p-4">
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
			<CreateDiscussion friendList={data.friendList}/>
		</div>
	</div>
{/if}

<style>
	#discussions {
		scrollbar-gutter: stable;
		scrollbar-width: thin;
	}
	/* #input-row { */
	/* 	box-shadow: -0px -2px 4px 0px; */
	/* } */
</style>
