<script lang="ts">
	/*  This page is responsible for displaying a channel
        and the associated input box. While the Chatbox could have been part of the layout
        it was deemed too complex for little benefit */

	/* types */
	import type { PageData } from "./$types"
	import type { Message, MessageOrEvent } from "$types"
	import type { Writable } from "svelte/store"

	/* Components */
	import DiscussionDisplay from "$components/DiscussionDisplay.svelte"
	import ChatBox from "$components/ChatBox.svelte"
	import { getContext, onMount } from "svelte"
	import { page } from "$app/stores"
	import { client } from "$clients"
	import { addListenerToEventSource, shallowCopyPartialToNotPartial } from "$lib/global"
	import { isContractError } from "contract"
	import { invalidate, invalidateAll } from "$app/navigation"

	console.log($page.route.id, "page init")

	export let data: PageData
	const sse_store: Writable<EventSource> = getContext("sse_store")
	const checkError: (ret: { status: number; body: any }, what: string) => void = (window as any)
		.checkError
	const makeToast: (message: string) => void = (window as any).makeToast

	let messages: MessageOrEvent[]
	let sendLoadEvents: boolean = true
	let disabled: boolean = false
    $: disabled = !data.chan?.selfPerms.includes("SEND_MESSAGE")
	let disabled_placeholder = "You have been muted" // ChatBox placeholder

	// Important, resets variable on route parameter change
	$: messages = data.messages

	// let chan: Chan = $page.data.chanList.find((el: Chan) => el.id === $page.params.chanId)
	// console.log("init", $page.data.chanList)

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
		console.log("new mesage: ", e)
		// conversation_container.scrollTop = conversation_container.scrollHeight
		messages = [
			...messages,
			{
				authorDisplayName: data.me.displayName,
				type: "message",
				id: "",
				content: e.detail,
				creationDate: new Date(),
				author: data.me.userName,
				hasBeenEdited: false,
				relatedTo: null,
				isDeleted: false,
			},
		]
		const ret = await client.chans.createChanMessage({
			params: {
				chanId: $page.params.chanId,
			},
			body: {
				content: e.detail,
			},
		})
		const last_elt_index = messages.length > 0 ? messages.length - 1 : 0
		if (ret.status !== 201) checkError(ret, "send message")
		else messages[last_elt_index] = ret.body
	}

	async function deletionHandler({ detail: { id: elementId } }: CustomEvent<{ id: string }>) {
		const ret = await client.chans.deleteChanMessage({
			body: null,
			params: {
				elementId,
				chanId: $page.params.chanId,
			},
		})
		if (ret.status === 200) {
			deleteSomeMessage(elementId)
		} else if (isContractError(ret)) {
			makeToast(
				`Message deletion denied. Server returned code ${ret.status}\n with message \"${ret.body.message}\"`,
			)
			console.warn(ret.body.code)
		} else {
			throw new Error("Unexpected return from server: " + JSON.stringify(ret))
		}
	}

	async function editHandler({
		detail: { id: elementId, new_message },
	}: CustomEvent<{ id: string; new_message: string }>) {
		const ret = await client.chans.updateChanMessage({
			body: { content: new_message },
			params: {
				elementId,
				chanId: $page.params.chanId,
			},
		})
		if (ret.status === 200) {
			updateSomeMessage(elementId, new_message, false)
		} else if (isContractError(ret)) {
			makeToast(
				`Server refused to edit message, returned code ${ret.status}\n with message \"${ret.body.message}\"`,
			)
			console.warn(ret.body.code)
		}
	}

	async function loadPreviousMessages({
		detail: { loading_greediness, cursor, canary },
	}: CustomEvent<{ loading_greediness: number; cursor: string; canary: HTMLElement }>) {
		const { status, body } = await client.chans.getChanElements({
			params: { chanId: $page.params.chanId },
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

	let header: HTMLElement | null
	let header_height: number
	onMount(() => {
		// Calculate the NavBar height in order to adapt the layout
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
			addListenerToEventSource($sse_store!, "CREATED_CHAN_USER", (new_data) => {
				console.log("Server message: New chan user", new_data)
				if (new_data.chanId === $page.params.chanId) {
					invalidate("app:chans")
					invalidate("app:chan:" + new_data.chanId)
				}
			}),
			addListenerToEventSource($sse_store!, "CREATED_CHAN_ELEMENT", (new_data) => {
				console.log("Server message: New chan element", new_data)
				if (new_data.chanId === $page.params.chanId) {
					messages = [...messages, new_data.element]
				}
			}),
			addListenerToEventSource($sse_store!, "UPDATED_CHAN_MESSAGE", (new_data) => {
				console.log("Server message: Message was modified", new_data)
				if (new_data.chanId === $page.params.chanId) {
					updateSomeMessage(
						new_data.message.id,
						new_data.message.content,
						new_data.message.isDeleted,
					)
				}
			}),
			addListenerToEventSource($sse_store!, "UPDATED_CHAN_SELF_PERMS", (new_data) => {
				console.log("UPDATED_CHAN_SELF_PERMS")
                console.log(new_data.selfPerms)
				invalidate("app:chans")
                invalidate("app:chan:" + new_data.chanId)
			}),
			addListenerToEventSource($sse_store!, "UPDATED_CHAN_USER", ({ chanId, user }) => {
				console.log("UPDATED_CHAN_USER")
				invalidate("app:chans")
			}),
			addListenerToEventSource($sse_store!, "BANNED_CHAN_USER", (new_data) => {
				console.log("BANNED_CHAN_USER")
				invalidate("app:chans")
			}),
			addListenerToEventSource($sse_store!, "DELETED_CHAN_USER", async (new_data) => {
				console.log("DELETED_CHAN_USER")
                await invalidate("app:chans")
                await invalidate("app:chan:" + new_data.chanId)
			}),
			addListenerToEventSource($sse_store!, "UPDATED_CHAN_SELF_PERMS", (new_data) => {
				console.log("UPDATED_CHAN_SELF_PERMS")
                invalidate("app:chans")
                invalidate("app:chan:" + new_data.chanId)
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
		discussion={data.chan}
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
