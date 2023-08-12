<script lang="ts">
	import { Avatar, popup, type PopupSettings } from "@skeletonlabs/skeleton"
	import { blur, slide } from "svelte/transition"
	import type { Chan, DirectConversation, Message } from "$types"
	import { my_name } from "$stores"
	import ChatBox from "$lib/ChatBox.svelte"
	import { listenOutsideClick, simpleKeypressHandlerFactory } from "$lib/global"
	import { createEventDispatcher } from "svelte"

	//Hack
	import { page } from "$app/stores"
	import type { z } from "zod"
	import { client } from "$clients"

	export let message: Message
	export let avatar_src: string
	export let from_me = message.author === $my_name
	export let discussion: Chan | DirectConversation

	// POPUP SECTION

	let perms: string[] | undefined
	let roles: string[] | undefined
	let isAdmin: boolean | undefined
	let popuptitems = [
		{ label: "Kick", handler: kickHandler },
		{ label: "Mute", handler: muteHandler },
	]
	let admin_button: (typeof popuptitems)[number]
	if (isChan(discussion)) {
		const user = discussion?.users.find(({ name }) => {
			return message.author === name
		})
		if (user) {
			perms = user.myPermissionOver
			roles = user.roles
			isAdmin = roles.includes("ADMIN")
			admin_button =
				isAdmin === true
					? { label: "Remove Admin status", handler: GrantAdminHandler }
					: { label: "Grant Adminstatus", handler: GrantAdminHandler }
			popuptitems = [...popuptitems, admin_button]
		}
	}

	const popupClick: PopupSettings = {
		event: "click",
		target: "popupClick",
		placement: "top",
	}

	function kickHandler() {}
	function muteHandler() {}
	function GrantAdminHandler() {
		client.chans.setUserAdminState({
			params: {
				chanId: discussion.id,
				username: message.author,
			},
			body: {
				state: true,
			},
		})
	}
	function isChan(arg: DirectConversation | Chan): arg is Chan {
		return !!(arg as any).users
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
	<!-- {#if !from_me} -->
	<div use:popup={popupClick}>
		<Avatar src={avatar_src} width="w-8 h-8" rounded="rounded-full" loading="lazy" />
	</div>
	{#if isChan(discussion)}
		<div data-popup="popupClick">
			<ol class="list variant-filled-primary rounded px-2 py-2">
				{#each popuptitems as popuptitem}
					<li>
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
	<!-- {/if} -->
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
			{#if perms}
				{#each perms as perm}
					<div>
						{perm}
					</div>
				{/each}
				<br />
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
				<menu class="card text-token mx-1 px-1">
					{#each menu_items as menu_item}
						<li class="card my-1 px-2 hover:variant-filled-secondary">
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
