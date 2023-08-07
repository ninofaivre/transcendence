<script lang="ts">
	/*  This page is responsible for displaying the current conversation with a friend.
        and the associated input box. While the Chatbox could have been part of the layout
        it was deemed too complex for little benefit */

	/* types */
	import type { PageData } from "./$types"
	import type { Message, MessageOrEvent } from "$types"

	/* Components */
	import DiscussionDisplay from "./DiscussionDisplay.svelte"
	import ChatBox from "$lib/ChatBox.svelte"
	import { onMount } from "svelte"
	import { page } from "$app/stores"
	import { client } from "$clients"
	import { addListenerToEventSource } from "$lib/global"
	import { sse_store } from "$stores"
	// import { message_indexes } from "$lib/indexes"

	console.log($page.route.id, " init")

	let messages: MessageOrEvent[]
	let sendLoadEvents: boolean = true
	sendLoadEvents = true

	// Important, resets variable on route parameter change
	$: messages = $page.data.messages
	$: $page.params.dmId, (sendLoadEvents = true)

	// for (let idx in messages) {
	// 	message_indexes.set(messages[idx], idx)
	// }

	function updateSomeMessage(to_update_id: string, new_message: string) {
		const to_update_idx: number = messages.findLastIndex((message: MessageOrEvent) => {
			return message.id === to_update_id
		})
		// We needed the index to operate directly on messages so that reactivity is triggered
		;(messages[to_update_idx] as Message).content = new_message
		return to_update_idx
	}

	function deleteSomeMessage(to_erase_id: string) {
		const to_update_idx: number = messages.findLastIndex((message: MessageOrEvent) => {
			return message.id === to_erase_id
		})
		// We needed the index to operate directly on messages so that reactivity is triggered
		;(messages[to_update_idx] as Message).isDeleted = true
		return to_erase_id
	}

	let new_message: [string, ReturnType<typeof client.dms.createDmMessage>]
	function messageSentHandler(e: CustomEvent<string>) {
		new_message = [
			e.detail,
			client.dms.createDmMessage({
				params: {
					dmId: $page.params.dmId,
				},
				body: {
					content: e.detail,
				},
			}),
		]
	}

	async function deletionHandler({ detail: { id: elementId } }: CustomEvent<{ id: string }>) {
		const { status, body } = await client.dms.deleteDmMessage({
			body: null,
			params: {
				elementId,
				dmId: $page.params.dmId,
			},
		})
		if (status === 202) {
			deleteSomeMessage(elementId)
		} else {
			console.error(
				`Message deletion denied. Server returned code ${status}\n with message \"${
					(body as any)?.message
				}\"`,
			)
		}
	}

	async function editHandler({
		detail: { id: elementId, new_message },
	}: CustomEvent<{ id: string; new_message: string }>) {
		const { status, body } = await client.dms.updateDmMessage({
			body: { content: new_message },
			params: {
				elementId,
				dmId: $page.params.dmId,
			},
		})
		if (status === 200) {
			updateSomeMessage(elementId, new_message)
		} else {
			console.error(
				`Server refused to edit message, returned code ${status}\n with message \"${
					(body as any)?.message
				}\"`,
			)
		}
	}

	async function loadPreviousMessages({
		detail: { loading_greediness, cursor, canary },
	}: CustomEvent<{ loading_greediness: number; cursor: string; canary: HTMLElement }>) {
		const { status, body } = await client.dms.getDmElements({
			params: { dmId: $page.params.dmId },
			query: { nElements: loading_greediness, cursor },
		})
		if (status == 200) {
			if (body.length > 0) {
				messages = [...body, ...messages]
				canary.nextElementSibling?.scrollIntoView()
			} else {
				sendLoadEvents = false
			}
		} else {
			console.error("Couldn't load previous messages. Request returned:", status)
		}
	}

	// Get our discussions
	// export let data: PageData // This almost always complains about data being "unknown"
	// const messages = $page.data.messages

	let header: HTMLElement | null
	let header_height: number
	let disabled: boolean = false
	let disabled_placeholder = "This user blocked you"

	// Calculate the NavBar height in order to adapt the layout
	onMount(() => {
		console.log("Mounting ", $page.route.id, "component")
		header = document.getElementById("shell-header")
		header_height = header?.offsetHeight || 0
		const resizeObserver = new ResizeObserver((entries) => {
			// We're only watching one element
			const new_height = entries.at(0)?.contentRect.height
			if (new_height && new_height !== header_height) {
				header_height = new_height
			}
		})
		resizeObserver.observe(header!)

		const destroyer: (() => void)[] = new Array(
			addListenerToEventSource($sse_store!, "CREATED_DM_ELEMENT", (data) => {
				console.log("Server message: New message", data)
				if (data.dmId === $page.params.dmId) {
					messages = [...messages, data.element]
					// const len = messages.length
					// message_indexes.set(messages[len - 1], len - 1)
				}
			}),

			addListenerToEventSource($sse_store!, "UPDATED_DM_MESSAGE", (data) => {
				console.log("Server message: Message was modified", data)
				if (data.dmId === $page.data.dmId) {
					updateSomeMessage(data.message.id, data.message.content)
				}
			}),
			addListenerToEventSource($sse_store!, "UPDATED_DM_STATUS", (data) => {
				disabled = data.status === "DISABLED" ? true : false
			}),
		)
		return () => {
			destroyer.forEach((func) => void func())
			resizeObserver.unobserve(header as HTMLElement) // Is this necessary ?
		}
	})
</script>

<!--Column layout -->
<!-- Rows for Column 2-->
<div class="grid grid-rows-[1fr_auto]" id="col2" style="height: calc(100vh - {header_height}px);">
	<!-- bit of hack because there's always the CREATED event message polluting a startgin conversation -->
	<!-- Messages -->
	<DiscussionDisplay
		{messages}
		{new_message}
		{sendLoadEvents}
		on:delete={deletionHandler}
		on:edit={editHandler}
		on:loadprevious={loadPreviousMessages}
	/>
	<section id="input-row" class="p-4">
		<ChatBox
			outline
			on:message_sent={messageSentHandler}
			maxRows={20}
			{disabled}
			{disabled_placeholder}
		/>
	</section>
</div>

<style>
	/* #input-row { */
	/* 	box-shadow: -0px -2px 4px 0px; */
	/* } */
</style>
