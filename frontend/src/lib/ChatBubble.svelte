<script lang="ts">
	import { Avatar, popup, type PopupSettings } from "@skeletonlabs/skeleton"
	import { blur, slide } from "svelte/transition"
	import type { Chan, DirectConversation, Message } from "$types"
	import { my_name } from "$stores"
	import ChatBox from "$lib/ChatBox.svelte"
	import { listenOutsideClick, simpleKeypressHandlerFactory } from "$lib/global"
	import { createEventDispatcher } from "svelte"
	import { makeToast } from "$lib/global"
	import { isContractError } from "contract"
	import { bs_hash } from "$lib/global"
	import { PUBLIC_BACKEND_URL } from "$env/static/public"

	import { client } from "$clients"
	import Toggle from "./Toggle.svelte"

	console.log("init ChatBubble")

	export let message: Message
	export let from_me = message.author === $my_name
	export let discussion: Chan | DirectConversation

	// POPUP SECTION

	let perms: string[] | undefined
	let roles: string[] | undefined

	let isAdmin: boolean | undefined
	let popuptitems = [
		{ label: "Kick", handler: kickHandler },
		{ label: "Mute", handler: mute },
		{ label: "Ban", handler: ban },
		{ label: "Grant Admin status", handler: toggleAdmin },
	]

	$: {
		if (discussion && isChan(discussion)) {
			const user = discussion?.users.find(({ name }) => {
				return message.author === name
			})
			if (user) {
				popuptitems[1] = user.myPermissionOver.includes("UNMUTE")
					? { label: "Mute", handler: mute }
					: { label: "UnMute", handler: unmute }
				// popuptitems[2] = user.myPermissionOver.includes("UNBAN")
				// 	? { label: "UnBan", handler: ban }
				// 	: { label: "Ban", handler: unban }
				isAdmin = user.roles.includes("ADMIN")
				popuptitems[3].label = isAdmin ? "Remove Admin status" : "Grant Admin status"
				popuptitems = popuptitems
				roles = user.roles
				perms = user.myPermissionOver
			}
		}
	}

	const popupClick: PopupSettings = {
		event: "click",
		target: "popupClick",
		placement: "top",
	}

	async function kickHandler() {
		const ret = await client.chans.kickUserFromChan({
			params: {
				chanId: discussion.id,
				username: message.author,
			},
			body: null,
		})
		if (ret.status == 202) {
			makeToast("Kicked " + message.author)
		} else if (isContractError(ret)) {
			makeToast(`Failed to kick ${message.author} from chan: ${ret.body.message}`)
			console.warn(ret.body.code)
		} else
			throw new Error(
				`Unexpected return from server when trying to toggle ${message.author} ADMIN status`,
			)
	}

	async function mute() {
		const ret = await client.chans.muteUserFromChan({
			params: {
				chanId: discussion.id,
				username: message.author,
			},
			body: {
				timeoutInMs: "infinity",
			},
		})
		if (ret.status == 202) {
			makeToast("Muted " + message.author)
		} else if (isContractError(ret)) {
			makeToast(`Failed to mute ${message.author}: ${ret.body.message}`)
			console.warn(ret.body.code)
		} else
			throw new Error(`Unexpected return from server when trying to mute ${message.author}`)
	}

	async function unmute() {
		const ret = await client.chans.unmuteUserFromChan({
			params: {
				chanId: discussion.id,
				username: message.author,
			},
		})
		if (ret.status == 202) {
			makeToast("Unmuted " + message.author)
		} else if (isContractError(ret)) {
			makeToast(`Failed to unmute ${message.author}: ${ret.body.message}`)
			console.warn(ret.body.code)
		} else
			throw new Error(`Unexpected return from server when trying to mute ${message.author}`)
	}

	async function ban() {
		// const ret = await client.chans.banUserFromChan({
		// 	params: {
		// 		chanId: discussion.id,
		// 		username: message.author,
		// 	},
		// 	body: {
		// 		timeoutInMs: "infinity",
		// 	},
		// })
		// if (ret.status == 202) {
		// 	makeToast("Banned " + message.author)
		// } else if (isContractError(ret)) {
		// 	makeToast(`Failed to ban ${message.author}: ${ret.body.message}`)
		// 	console.warn(ret.body.code)
		// } else throw new Error(`Unexpected return from server when trying to ban ${message.author}`)
	}
	async function unban() {
		// const ret = await client.chans.unbanUserFromChan({
		// 	params: {
		// 		chanId: discussion.id,
		// 		username: message.author,
		// 	},
		// 	body: {
		// 		timeoutInMs: "infinity",
		// 	},
		// })
		// if (ret.status == 202) {
		// 	makeToast("Unbanned " + message.author)
		// } else if (isContractError(ret)) {
		// 	makeToast(`Failed to unban ${message.author}: ${ret.body.message}`)
		// 	console.warn(ret.body.code)
		// } else
		// 	throw new Error(`Unexpected return from server when trying to unban ${message.author}`)
	}

	async function toggleAdmin() {
		const state = !isAdmin
		const ret = await client.chans.setUserAdminState({
			params: {
				chanId: discussion.id,
				username: message.author,
			},
			body: {
				state,
			},
		})
		if (ret.status === 204) {
			if (state) {
				makeToast(message.author + " was granted Admin status")
			} else {
				makeToast(message.author + " lost Admin status")
			}
		} else if (isContractError(ret)) {
			if (state) {
				makeToast(
					"Couldn't grant Admin status to user" +
						message.author +
						": " +
						ret.body.message,
				)
			} else {
				makeToast(
					"Couldn't remove Admin status from user" +
						message.author +
						": " +
						ret.body.message,
				)
			}
			console.warn(ret.body.code)
		} else
			throw new Error(
				`Unexpected return from server when trying to toggle ${message.author} ADMIN status`,
			)
	}

	function isChan(arg: DirectConversation | Chan): arg is Chan {
		return !!(arg as any).users
	}

	$: {
		console.log((discussion as Chan)?.users)
	}

	// MENU SECTION
	const dispatch = createEventDispatcher()
	let is_menu_open = false
	let contenteditable = false
	let openMenu = () => {
		is_menu_open = true
	}
	let closeMenu = () => {
		is_menu_open = false
	}
	let editHandler = () => {
		closeMenu()
		contenteditable = true
	}
	let menu_items = from_me
		? [
				{ label: "Edit", handler: editHandler },
				{ label: "Delete", handler: forwardAsDeletionEvent },
				{ label: "Reply", handler: replyHandler },
		  ]
		: [{ label: "Reply", handler: replyHandler }]

	async function replyHandler() {}

	$: is_sent = message?.id !== ""

	async function forwardAsEditEvent(e: CustomEvent<string>) {
		contenteditable = false
		closeMenu()
		is_sent = false
		dispatch("edit", { id: message.id, new_message: e.detail })
	}

	async function forwardAsDeletionEvent() {
		contenteditable = false
		closeMenu()
		is_sent = false
		dispatch("delete", { id: message.id })
	}
</script>

<div
	id={message.id}
	style={`flex-direction: ${from_me ? "row-reverse" : "row"}`}
	class={`message-row ${from_me ? "space-x-2 space-x-reverse" : "space-x-2"}`}
>
	<div class="message-spacer" />
	{#if !from_me}
		<div use:popup={popupClick}>
			<Avatar
				src="{PUBLIC_BACKEND_URL}/api/users/{message.author}/profilePicture"
				fallback="https://i.pravatar.cc/?u={message.author}"
				class="h-8 w-8"
				rounded="rounded-full"
			/>
		</div>
		{#if isChan(discussion)}
			<div data-popup="popupClick">
				<ol class="list variant-filled-tertiary rounded px-2 py-2">
					{#each popuptitems as popuptitem}
						<li class="">
							<button
								class="btn btn-sm variant-filled-secondary flex-auto"
								on:click={popuptitem.handler}>{popuptitem.label}</button
							>
						</li>
					{/each}
					<div class="arrow variant-filled-primary" />
				</ol>
			</div>
		{/if}
	{/if}
	<div
		class={`message-bubble ${from_me ? "variant-filled-primary" : "variant-filled-secondary"}`}
	>
		<!-- {#if !from_me} -->
		<div class="from-field font-medium">{message.author}</div>
		<!-- {/if} -->
		<div class="grid grid-cols-[auto_1fr]">
			{#if !is_sent}
				<div
					class="spinner-container self-center"
					out:slide={{ axis: "x", duration: 1000 }}
				>
					<div class="spinner" out:blur={{ duration: 500 }} />
				</div>
			{/if}
			<!-- {#if roles} -->
			<!-- 	{#each roles as role} -->
			<!-- 		<div class="italic"> -->
			<!-- 			{role}<br /> -->
			<!-- 		</div> -->
			<!-- 		<br /> -->
			<!-- 	{/each} -->
			<!-- {/if} -->
			{#if perms}
				{#each perms as perm}
					<div class="italic">
						{perm}<br />
					</div>
					<br />
				{/each}
			{/if}
			<div class="message-container">
				{#if !contenteditable}
					{#if !message.isDeleted}
						{message.content}
					{:else}
						<i>This message has been deleted</i>
					{/if}
				{:else}
					<ChatBox value={message.content} on:message_sent={forwardAsEditEvent} />
				{/if}
			</div>
		</div>
	</div>
	{#if is_sent}
		{#if is_menu_open}
			<div class="contents" use:listenOutsideClick on:outsideclick={closeMenu}>
				<menu class="list text-token mx-1 px-1">
					{#each menu_items as menu_item}
						<li class="my-1 list-item px-2 hover:variant-filled-secondary">
							<button tabindex="0" on:click={menu_item.handler}>
								{menu_item.label}
							</button>
						</li>
					{/each}
				</menu>
			</div>
		{:else}
			<div
				role="menu"
				tabindex="0"
				on:click={openMenu}
				on:keypress={simpleKeypressHandlerFactory(["Enter"], openMenu)}
				class="kebab self-start text-xl"
			>
				&#xFE19;
			</div>
		{/if}
	{/if}
</div>

<style>
	div.kebab {
		visibility: hidden;
	}

	div:hover > div.kebab {
		visibility: visible;
	}

	div.kebab:hover {
		font-weight: 700;
		cursor: pointer;
	}

	.message-row {
		display: flex;
		margin-top: 8px;
		margin-bottom: 8px;
	}

	.message-bubble {
		max-width: 80%;
		border-radius: 10px;
		padding: 0.5rem;
	}

	.from-field,
	.message-container {
		max-width: 100%;
		overflow: hidden;
		overflow-wrap: break-word; /*So that max-width is not ignored if a word is too long*/
	}

	.message-container {
		white-space: pre-wrap;
	}

	.from-field {
		font-size: 0.8em;
	}

	/* .spinner-container { */
	/* 	padding-right: 3px; */
	/* } */

	.spinner {
		height: 0.6em;
		width: 0.6em;
		border: 1px solid;
		border-radius: 50%;
		border-top-color: transparent;
		border-bottom-color: transparent;
		align-self: center;
		animation: spin 0.8s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
