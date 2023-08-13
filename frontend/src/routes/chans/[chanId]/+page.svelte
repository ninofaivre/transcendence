<script lang="ts">
	/*  This page is responsible for displaying a channel
        and the associated input box. While the Chatbox could have been part of the layout
        it was deemed too complex for little benefit */

	/* types */
	import type { PageData } from "./$types"
	import type { Chan, Message, MessageOrEvent } from "$types"

	/* Components */
	import DiscussionDisplay from "$lib/DiscussionDisplay.svelte"
	import ChatBox from "$lib/ChatBox.svelte"
	import { onMount } from "svelte"
	import { page } from "$app/stores"
	import { client } from "$clients"
	import { addListenerToEventSource, shallowCopyPartialToNotPartial } from "$lib/global"
	import { sse_store, my_name } from "$stores"
	import InviteFriendToChan from "$lib/InviteFriendToChan.svelte"
	import Toggle from "$lib/Toggle.svelte"

	console.log($page.route.id, " init")

	let messages: MessageOrEvent[]
	let sendLoadEvents: boolean = true
	let chan: Chan

	// Important, resets variable on route parameter change
	$: messages = $page.data.messages
	$: {
		chan = $page.data.chanList.find((el: Chan) => el.id === $page.params.chanId)
		sendLoadEvents = true
	}

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
				author: $my_name,
				hasBeenEdited: false,
				relatedTo: null,
				isDeleted: false,
			},
		]
		const { status, body } = await client.chans.createChanMessage({
			params: {
				chanId: $page.params.chanId,
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
		const { status, body } = await client.chans.deleteChanMessage({
			body: null,
			params: {
				elementId,
				chanId: $page.params.chanId,
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
		const { status, body } = await client.chans.updateChanMessage({
			body: { content: new_message },
			params: {
				elementId,
				chanId: $page.params.chanId,
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
			addListenerToEventSource($sse_store!, "CREATED_CHAN_ELEMENT", (data) => {
				console.log("Server message: New message", data)
				if (data.chanId === $page.params.chanId) {
					messages = [...messages, data.element]
				}
			}),
			addListenerToEventSource($sse_store!, "UPDATED_CHAN_MESSAGE", (data) => {
				console.log("Server message: Message was modified", data)
				if (data.chanId === $page.data.chanId) {
					updateSomeMessage(data.message.id, data.message.content)
				}
			}),
			addListenerToEventSource($sse_store!, "UPDATED_CHAN_SELF_PERMS", (data) => {
				console.log("New perms have arrived !", data)
			}),
			addListenerToEventSource($sse_store!, "UPDATED_CHAN_USER", ({ chanId, user }) => {
				if (chanId === chan.id) {
					let index = chan.users.findIndex((o) => o.name == user.name)
					console.log("old user:", chan.users[index])
					console.log("new user:", user)
					shallowCopyPartialToNotPartial(user, chan.users[index])
					chan = chan
				}
			}),
			// Add event listener to listen to mute event
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
		on:delete={deletionHandler}
		on:edit={editHandler}
		on:loadprevious={loadPreviousMessages}
	/>
	<section id="input-row" class="p-4">
		<Toggle let:toggle>
			<svelte:fragment let:toggle slot="active">
				<InviteFriendToChan
					friendList={$page.data.friendList}
					chan_id={$page.params.chanId}
					on:cancel={toggle}
					on:submit={toggle}
				/>
			</svelte:fragment>
			<button class="btn btn-sm variant-filled" on:click={toggle}
				>Invite friends to this channel</button
			>
		</Toggle>
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
