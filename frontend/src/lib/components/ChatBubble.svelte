<script lang="ts">
	import type { Writable } from "svelte/store"
	import type { ModalSettings } from "@skeletonlabs/skeleton"
	import type { Chan, ChanMessage, DirectConversation, GameSocket, Message } from "$types"

	//Components
	import ChatBox from "$components/ChatBox.svelte"

	//Utils
	import { blur, slide } from "svelte/transition"
	import { listenOutsideClick, simpleKeypressHandlerFactory } from "$lib/global"
	import { createEventDispatcher } from "svelte"
	import { PUBLIC_BACKEND_URL } from "$env/static/public"
	import { getModalStore } from "@skeletonlabs/skeleton"
	import { client } from "$clients"
	import { goto, invalidate } from "$app/navigation"
	import ProfilePicture from "$components/ProfilePicture.svelte"
	import { page } from "$app/stores"

	const modalStore = getModalStore()

	const checkError: (ret: { status: number; body: any }, what: string) => void = (window as any)
		.checkError
	const makeToast: (message: string) => void = (window as any).makeToast

	export let message: Message
	export let my_name: string
	export let from_me: boolean
	export let discussion: Chan | DirectConversation
	export let game_socket: Writable<GameSocket>

	let blurred = false
	if (isChanMesssage(message)) {
		blurred = message.isAuthorBlocked
	}

	// POPUP SECTION
	let perms: string[] | undefined
	let roles: string[] | undefined

	let is_admin_menu_open = false
	let toggleAdminMenu = () => (is_admin_menu_open = !is_admin_menu_open)
	// let filterType: "#Noir" | "" = ""
	const menu_init: { label: string; handler: () => void }[] = [
		{ label: "Show profile", handler: () => goto(`/users/${message.author}`) },
		{ label: "Invite to a game", handler: inviteToGame },
	]
	let menu = menu_init
	const is_chan = isChan(discussion)
	let isAdmin: boolean | undefined

	$: {
		if (isChan(discussion)) {
			const user = (discussion as Chan).users.find(({ name }) => {
				return message.author === name
			})
			if (user) {
				isAdmin = user.roles.includes("ADMIN")
				const isMuted = user.myPermissionOver.includes("UNMUTE")
				const canMute = user.myPermissionOver.includes("MUTE")
				const canKick = user.myPermissionOver.includes("KICK")
				const canBan = user.myPermissionOver.includes("BAN")
				const canToggleAdminStatus = (discussion as Chan).ownerName === my_name
				menu = menu_init
				if (canMute) {
					menu = [
						...menu,
						isMuted
							? { label: "UnMute", handler: unmute }
							: { label: "Mute", handler: mute },
					]
				}
				if (canKick) {
					menu = [...menu, { label: "Kick", handler: kickHandler }]
				}
				if (canToggleAdminStatus) {
					menu = [
						...menu,
						isAdmin
							? { label: "Remove Admin status", handler: toggleAdmin }
							: { label: "Grant Admin status", handler: toggleAdmin },
					]
				}
				if (canBan) {
					menu = [...menu, { label: "Ban", handler: ban }]
				}
				//DEBUG
				roles = user.roles
				perms = user.myPermissionOver
			}
		}
	}

	async function inviteToGame() {
		const r = await new Promise<true | undefined>((resolve) => {
			const modal: ModalSettings = {
				type: "component",
				component: "WaitForGameModal",
				response: (r) => {
					modalStore.close()
					resolve(r)
				},
				meta: { username: message.author, game_socket },
			}
			modalStore.trigger(modal)
		})
		if (r) {
			goto("/pong")
		}
	}

	async function kickHandler() {
		const ret = await client.chans.kickUserFromChan({
			params: {
				chanId: discussion.id,
				username: message.author,
			},
			body: null,
		})
		if (ret.status != 204) checkError(ret, `kick ${message.authorDisplayName}`)
		else makeToast("Kicked " + message.authorDisplayName)
	}

	async function mute() {
		const r = await new Promise<string | undefined>((resolve) => {
			const modal: ModalSettings = {
				type: "component",
				component: "TimeChooserModal",
				response: (r) => {
					modalStore.close()
					resolve(r)
				},
			}
			modalStore.trigger(modal)
		})
		if (r) {
			const ret = await client.chans.muteUserFromChan({
				params: {
					chanId: discussion.id,
					username: message.author,
				},
				body: {
					timeoutInMs: Number(r),
				},
			})
			if (ret.status != 204) checkError(ret, `mute ${message.authorDisplayName}`)
			else makeToast("Muted " + message.authorDisplayName)
		}
	}

	async function unmute() {
		const ret = await client.chans.unmuteUserFromChan({
			params: {
				chanId: discussion.id,
				username: message.author,
			},
			body: null,
		})
		if (ret.status != 204) checkError(ret, `unmute ${message.authorDisplayName}`)
		else makeToast("Unmuted " + message.authorDisplayName)
	}

	async function ban() {
		const ret = await client.chans.banUserFromChan({
			params: {
				chanId: discussion.id,
				username: message.author,
			},
			body: {
				timeoutInMs: "infinity",
			},
		})
		if (ret.status != 204) checkError(ret, `ban ${message.authorDisplayName}`)
		else makeToast("Banned " + message.authorDisplayName)
	}

	async function unban() {
		const ret = await client.chans.unbanUserFromChan({
			params: {
				chanId: discussion.id,
				username: message.author,
			},
			body: null,
		})
		if (ret.status != 204) checkError(ret, `unban ${message.authorDisplayName}`)
		else makeToast("Unbanned " + message.authorDisplayName)
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
		if (ret.status != 204) checkError(ret, `unban ${message.authorDisplayName}`)
		else if (ret.status === 204) {
			if (state) {
				makeToast(message.authorDisplayName + " was granted Admin status")
			} else {
				makeToast(message.authorDisplayName + " lost Admin status")
			}
			// No need to invalidate because event is received
		}
	}

	function isChan(arg: DirectConversation | Chan): arg is Chan {
		return "users" in arg
	}

	function isChanMesssage(arg: Message): arg is ChanMessage {
		return "isAuthorBlocked" in arg
	}

	// MENU SECTION
	const dispatch = createEventDispatcher()
	let is_message_menu_open = false
	let contenteditable = false
	let openMenu = () => {
		is_message_menu_open = true
	}
	let closeMenu = () => {
		is_message_menu_open = false
	}
	let editHandler = () => {
		closeMenu()
		contenteditable = true
	}

	let menu_items: ({ label: "Edit", handler: typeof editHandler }
        | { label: "Delete", handler: typeof forwardAsDeletionEvent }
    )[] = []

	$: {
        let canDelete = false
        let canEdit = false
		if (message.author === my_name) {
            if (!message.isDeleted) {
                canDelete = true
                if (isChan(discussion) && discussion.selfPerms.includes("SEND_MESSAGE")) {
                    canEdit = true
                }
                else if (!isChan(discussion) && discussion.status === "ENABLED") {
                    canEdit = true
                }
            }
		}
        else if (isChan(discussion)) {
             canDelete =  discussion.users.find(el => message.author === el.name)?.myPermissionOver.includes("DELETE_MESSAGE") || false
            if (message.isDeleted) 
                canDelete = false
        }
        menu_items = [
            ...(canEdit ? [{ label: "Edit", handler: editHandler } as const] : []),
            ...(canDelete ? [{ label: "Delete", handler: forwardAsDeletionEvent } as const] : []),
        ]
    }

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
		<!-- Need online status for that -->
		<!-- <span class="relative left-1 text-xl text-green-600">&#8226</span> -->
		{#if is_chan}
			<button
				on:click={() => {
					menu.length > 1 ? toggleAdminMenu() : menu[0].handler()
				}}
				on:keydown={() =>
					simpleKeypressHandlerFactory(["Enter"], () => {
						menu.length > 1 ? toggleAdminMenu() : menu[0].handler()
					})}
			>
				<ProfilePicture
					src="{PUBLIC_BACKEND_URL}/api/users/{message.author}/profilePicture?id={message.author}"
					fallback="https://i.pravatar.cc/?u={message.author}"
					class="h-8 w-8"
				/>
			</button>
		{/if}
		{#if is_admin_menu_open}
			<ol
				use:listenOutsideClick
				on:outsideclick={() => (is_admin_menu_open = false)}
				transition:slide={{ axis: "x", duration: 200 }}
				class="variant-filled-tertiary list rounded px-2 py-2"
			>
				{#each menu as item}
					<li class="">
						<button
							class="variant-filled-secondary btn btn-sm flex-auto"
							on:click={item.handler}>{item.label}</button
						>
					</li>
				{/each}
			</ol>
		{/if}
	{/if}
	<div
		class={`message-bubble ${from_me ? "variant-filled-primary" : "variant-filled-secondary"}`}
		style:filter={blurred ? "blur(4px)" : "none"}
		on:click={() => (blurred = false)}
		on:keydown
		role="none"
	>
		<!-- {#if !from_me} -->
		<div class="from-field font-medium">{message.authorDisplayName}</div>
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
	{#if is_sent && menu_items.length > 0}
		{#if is_message_menu_open}
			<div class="contents" use:listenOutsideClick on:outsideclick={closeMenu}>
				<menu class="text-token list mx-1 px-1">
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
