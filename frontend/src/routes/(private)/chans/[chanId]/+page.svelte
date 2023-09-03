<script lang="ts">
	/*  This page is responsible for displaying a channel
        and the associated input box. While the Chatbox could have been part of the layout
        it was deemed too complex for little benefit */

	/* types */
	import type { PageData } from "./$types"
	import type { Chan, Message, MessageOrEvent } from "$types"
	import type { Writable } from "svelte/store"

	/* Components */
	import DiscussionDisplay from "$lib/DiscussionDisplay.svelte"
	import ChatBox from "$lib/ChatBox.svelte"
	import { getContext, onMount } from "svelte"
	import { page } from "$app/stores"
	import { client } from "$clients"
	import {
		addListenerToEventSource,
		checkError,
		makeToast,
		shallowCopyPartialToNotPartial,
	} from "$lib/global"
	import { isContractError } from "contract"
	import { invalidate, invalidateAll } from "$app/navigation"
	import { getModalStore, type ModalSettings } from "@skeletonlabs/skeleton"

	console.log($page.route.id, " init")

	export let data: PageData
	const modalStore = getModalStore()
	const sse_store: Writable<EventSource> = getContext("sse_store")

	let messages: MessageOrEvent[]
	let sendLoadEvents: boolean = true
	let chan: Chan = $page.data.chanList.find((el: Chan) => el.id === $page.params.chanId)
	// let disabled: boolean = !$page?.data?.chanList?.selfPerms.includes("SEND_MESSAGE") ?? false
	let disabled: boolean = false
	let disabled_placeholder = "You have been muted" // ChatBox placeholder

	// Important, resets variable on route parameter change
	$: messages = $page.data.messages // Need this becaus I can't mody the store directly
	$: {
		chan = $page.data.chanList.find((el: Chan) => el.id === $page.params.chanId)
		sendLoadEvents = true
		disabled = !chan.selfPerms.includes("SEND_MESSAGE")
		console.log("from page reactive block: ", disabled)
	}
	// $: disabled, console.log(disabled)

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

	async function messageSentHandler(e: CustomEvent<string>) {
		console.log("new mesage: ", e)
		// conversation_container.scrollTop = conversation_container.scrollHeight
		messages = [
			...messages,
			{
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
			updateSomeMessage(elementId, new_message)
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

	// Get our discussions
	// export let data: PageData // This almost always complains about data being "unknown"
	// const messages = $page.data.messages

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
			addListenerToEventSource($sse_store!, "CREATED_CHAN_ELEMENT", (data) => {
				console.log("Server message: New chan element", data)
				if (data.chanId === $page.params.chanId) {
					messages = [...messages, data.element]
				}
			}),
			addListenerToEventSource($sse_store!, "UPDATED_CHAN_MESSAGE", (data) => {
				console.log("Server message: Message was modified", data)
				if (data.chanId === $page.params.chanId) {
					updateSomeMessage(data.message.id, data.message.content)
				}
			}),
			addListenerToEventSource($sse_store!, "UPDATED_CHAN_SELF_PERMS", (data) => {
				if (data.chanId === $page.params.chanId) {
					console.log("Self perms updated", data)
					chan.selfPerms = data.selfPerms
				}
			}),
			addListenerToEventSource($sse_store!, "UPDATED_CHAN_USER", ({ chanId, user }) => {
				if (chanId === $page.params.chanId) {
					let index = chan.users.findIndex((o) => o.name == user.name)
					// console.log("old user:", chan.users[index])
					// console.log("new user:", user)
					shallowCopyPartialToNotPartial(user, chan.users[index])
					chan = chan
				}
			}),
			addListenerToEventSource($sse_store!, "KICKED_FROM_CHAN", () => {
				invalidateAll()
			}),
			addListenerToEventSource($sse_store!, "BANNED_FROM_CHAN", () => {
				invalidateAll()
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
		discussion={chan}
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
