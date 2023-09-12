<script lang="ts">
	/*  This page is responsible for displaying the current conversation with a friend.
        and the associated input box. While the Chatbox could have been part of the layout
        it was deemed too complex for little benefit */

	/* types */
	import type { PageData } from "./$types"
	import type { DirectConversation, Message, MessageOrEvent } from "$types"

	/* Components */
	import DiscussionDisplay from "$components/DiscussionDisplay.svelte"
	import ChatBox from "$components/ChatBox.svelte"
	import { getContext, onMount } from "svelte"
	import { page } from "$app/stores"
	import { client } from "$clients"
	import { addListenerToEventSource } from "$lib/global"
	import type { Writable } from "svelte/store"

	console.log($page.route.id, " init")

	let messages: MessageOrEvent[]
	let sendLoadEvents: boolean = true
	let dm: DirectConversation

	export let data: PageData
	const sse_store: Writable<EventSource> = getContext("sse_store")

	// Important, resets variable on route parameter change
	$: messages = data.messages
	$: {
		dm = data.dmList.find((el: DirectConversation) => el.id === $page.params.dmId)!
		sendLoadEvents = true
	}

	function updateSomeMessage(to_update_id: string, new_message: string, isDeleted: boolean) {
		const to_update_idx: number = messages.findLastIndex((message: MessageOrEvent) => {
			return message.id === to_update_id
		})
		// We needed the index to operate directly on messages so that reactivity is triggered
		;(messages[to_update_idx] as Message).content = new_message
		;(messages[to_update_idx] as Message).isDeleted = isDeleted
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

	async function messageSentHandler(e: CustomEvent<string>) {
		// conversation_container.scrollTop = conversation_container.scrollHeight
		messages = [
			...messages,
			{
				type: "message",
				authorDisplayName: data.me.displayName,
				id: "",
				content: e.detail,
				creationDate: new Date(),
				author: data.me.userName,
				hasBeenEdited: false,
				relatedTo: null,
				isDeleted: false,
			},
		]
		const { status, body } = await client.dms.createDmMessage({
			params: {
				dmId: $page.params.dmId,
			},
			body: {
				content: e.detail,
			},
		})
		const last_elt_index = messages.length > 0 ? messages.length - 1 : 0
		if (status == 201 && body) {
			messages[last_elt_index] = body
		} else
			console.error(
				"The message sent was received by the server but has not been created. Server responder with:",
				status,
			)
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
			updateSomeMessage(elementId, new_message, false)
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
	$: disabled = data.dmList.find((el) => el.id === $page.params.dmId)?.status === "DISABLED"
	let disabled_placeholder = "Disabled"

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
			addListenerToEventSource($sse_store, "CREATED_DM_ELEMENT", (data) => {
				console.log("Server message: New message", data)
				if (data.dmId === $page.params.dmId) {
					messages = [...messages, data.element]
				}
			}),
			addListenerToEventSource($sse_store, "UPDATED_DM_MESSAGE", (new_data) => {
				console.log("Server message: Message was modified", new_data)
				if (new_data.dmId === $page.params.dmId) {
					updateSomeMessage(
						new_data.message.id,
						new_data.message.content,
						new_data.message.isDeleted,
					)
				}
			}),
			addListenerToEventSource($sse_store, "BLOCKED_BY_USER", (new_data) => {
				if (
					data.dmList.find((el) => el.otherName === new_data.username)!.id ===
					$page.params.dmId
				) {
					disabled = true
				}
			}),
			addListenerToEventSource($sse_store, "UNBLOCKED_BY_USER", (new_data) => {
				if (
					data.dmList.find((el) => el.otherName === new_data.username)!.id ===
					$page.params.dmId
				) {
					disabled = false
				}
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
	<!-- Messages -->
	<DiscussionDisplay
		discussion={dm}
		{messages}
		{sendLoadEvents}
		my_name={data.me.userName}
		on:delete={deletionHandler}
		on:edit={editHandler}
		on:loadprevious={loadPreviousMessages}
	/>
	<section id="input-row" class="p-4">
		<ChatBox
			outline
			on:message_sent={messageSentHandler}
			max_rows={20}
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
