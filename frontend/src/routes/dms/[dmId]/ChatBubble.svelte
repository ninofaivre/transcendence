<script lang="ts">
	import { Avatar, ProgressRadial } from "@skeletonlabs/skeleton"
	import { fade, fly, blur, crossfade, draw, slide, scale } from "svelte/transition"
	import type { DirectMessage } from "$types"
	import { my_name } from "$stores"
	import { client }  from "$clients"
	import { page } from "$app/stores"
	import ChatBox from "./ChatBox.svelte"
	import { listenOutsideClick } from "$lib/global"

	export let message: DirectMessage

	let from = message.author
	let from_me = message.author === $my_name
	let is_menu_open = false
	let message_container: HTMLElement
	let message_row: HTMLDivElement
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
	let replyHandler = () => {}

	$: is_sent = message?.id !== ""

	async function deleteHandler() {
		is_menu_open = false
		is_sent = false
		const { status, body } = await client.dms.deleteDmMessage({
			body: null,
			params: {
				messageId: message_row.id,
				dmId: $page.params.dmId,
			},
		})
		is_sent = true
		if (status === 202) {
			message_container.innerHTML = "<i>This message has been deleted</i>"
		} else {
			console.error(
				`Message deletion denied. Server returned code ${status}\n with message \"${
					(body as any)?.message
				}\"`,
			)
		}
	}

	async function updateMessage(e: CustomEvent<string>) {
		contenteditable = false
		is_sent = false
		const { status, body } = await client.dms.updateMessage({
			body: { content: e.detail },
			params: {
				elementId: message_row.id,
				dmId: $page.params.dmId,
			},
		})
		is_sent = true
		if (status === 200) {
			message = body as DirectMessage
		} else {
			console.error(
				`Server refused to edit message, returned code ${status}\n with message \"${
					(body as any)?.message
				}\"`,
			)
		}
	}
</script>

<div
	id={message.id}
	style={`flex-direction: ${from_me ? "row-reverse" : "row"}`}
	class={`message-row ${from_me ? "space-x-2 space-x-reverse" : "space-x-2"}`}
	bind:this={message_row}
>
	<div class="message-spacer" />
	<Avatar src="https://i.pravatar.cc/?img=42" width="w-8 h-8" rounded="rounded-full" />
	<div
		class={`message-bubble ${from_me ? "variant-filled-primary" : "variant-filled-secondary"}`}
	>
		{#if !from_me}
			<div class="from-field font-medium">{from}</div>
		{/if}
		<div class="grid grid-cols-[auto_1fr]">
			{#if !is_sent}
				<div class="spinner-container self-center" out:slide={{ axis: "x", duration: 800 }}>
					<ProgressRadial
						width="w-3"
						stroke={140}
						value={undefined}
						meter="stroke-error-500"
						track="stroke-error-500/30"
					/>
				</div>
			{/if}
			{#if !contenteditable}
				{#if !message.isDeleted}
					<div bind:this={message_container} class="message-container">
						{message.content}
					</div>
				{:else}
					<div bind:this={message_container} class="message-container">
						<i>This message has been deleted</i>
					</div>
				{/if}
			{:else}
				<ChatBox on:message_sent={updateMessage} />
			{/if}
		</div>
	</div>
	{#if is_menu_open}
		<div class="contents" use:listenOutsideClick on:outsideclick={closeMenu}>
			<ul class="card mx-1 px-1 text-token">
				{#if from_me}
					<li
						class="card my-1 px-2 hover:variant-filled-secondary"
						on:click={editHandler}
					>
						Edit
					</li>
					<li
						class="card my-1 px-2 hover:variant-filled-secondary"
						on:click={deleteHandler}
					>
						Delete
					</li>
				{:else}
					<li
						class="card my-1 px-2 hover:variant-filled-secondary"
						on:click={replyHandler}
					>
						Reply
					</li>
				{/if}
			</ul>
		</div>
	{:else}
		<div on:click={openMenu} class="kebab self-center text-xl">&#xFE19;</div>
	{/if}
</div>

<style>
	/* Does not work  when element is removed*/
	/* #message-container { */
	/* 	transition: 1s ease-in-out; */
	/* } */

	/**
     * Applies to slotted element. Don't do nothing if it's just text inside. (No child)
     */
	/* #message-container :global(> :last-child) { */
	/* } */

	div.kebab {
		visibility: hidden;
	}

	div:hover > div.kebab {
		visibility: visible;
	}

	.message-row {
		display: flex;
		margin-top: 8px;
		margin-bottom: 8px;
	}

	.message-bubble {
		max-width: 80%;
		overflow-wrap: break-word; /*So that max-width is not ignored if a word is too long*/
		border-radius: 10px;
		padding: 4px;
	}

	.from-field,
	.message-container {
		margin-left: 0.5rem;
		margin-right: 0.5rem;
	}

	.from-field {
		font-size: 0.8em;
	}

	.spinner-container {
		padding-right: 3px;
	}
</style>
