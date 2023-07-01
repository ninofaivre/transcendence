<script lang="ts">
	/*  This page is responsible for displaying the current conversation with a friend.
        and the associated input box. While the Chatbox could have been part of the layout
        it was deemed too complex for little benefit */

	/* types */
	import type { PageData } from "./$types"

	/* Components */
	import DiscussionDisplay from "./DiscussionDisplay.svelte"
	import ChatBox from "./ChatBox.svelte"
	import { onMount } from "svelte"
	import { page } from "$app/stores"
	import { chansClient } from "$clients"

	// let new_message: [string, Promise<ClientInferResponses<typeof contract.chans.createChan>>]
	// let new_message: [string, Promise<Response>]
	// let new_message: [string, ReturnType<typeof chansClient.createChanMessage>]
	// function messageSentHandler(e: CustomEvent<typeof new_message>) {
	// 	console.log("You sent a message:", e.detail[0])
	// 	new_message = e.detail
	// }
	let new_message: [string, ReturnType<typeof chansClient.createChanMessage>]
	function messageSentHandler(e: CustomEvent<string>) {
		console.log("You sent a message:", e.detail)
		new_message = [
			e.detail,
			chansClient.createChanMessage({
				params: {
					chanId: $page.params.chanId,
				},
				body: {
					content: e.detail,
				},
			}),
		]
	}

	// Get our discussions
	// export let data: PageData // This almost always complains about data being "unknown"
	// const messages = $page.data.messages

	let header: HTMLElement | null
	let header_height: number

	// Calculate the NavBar height in order to adapt the layout
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

<!--Column layout -->
<!-- Rows for Column 2-->
<div class="grid grid-rows-[1fr_auto]" id="col2" style="height: calc(100vh - {header_height}px);">
	<!-- bit of hack because there's always the CREATED event message polluting a startgin conversation -->
	<!-- Messages -->
	<DiscussionDisplay
		messages={$page.data.messages}
		{new_message}
		currentDiscussionId={$page.params.chanId}
	/>
	<section id="input-row" class="p-4">
		<ChatBox on:message_sent={messageSentHandler} maxRows={20} />
	</section>
</div>

<style>
	/* #input-row { */
	/* 	box-shadow: -0px -2px 4px 0px; */
	/* } */
</style>
