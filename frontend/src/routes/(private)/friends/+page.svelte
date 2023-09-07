<script lang="ts">
	import type { TableSource } from "@skeletonlabs/skeleton"

	import { Table, getToastStore } from "@skeletonlabs/skeleton"
	import { tableMapperValues } from "@skeletonlabs/skeleton"
	import { client } from "$clients"
	import SendFriendRequest from "$lib/SendFriendRequest.svelte"
	import { invalidate, invalidateAll } from "$app/navigation"
	import { addListenerToEventSource, makeToast } from "$lib/global"
	import { getContext, onMount } from "svelte"
	import type { Writable } from "svelte/store"
	import type { PageData } from "./$types"

	// For some reason invalidate seems to work in this file, go figure
	export let data: PageData
	const sse_store: Writable<EventSource> = getContext("sse_store")
	const toastStore = getToastStore()

	onMount(() => {
		const destroyer = new Array(
			addListenerToEventSource($sse_store, "CREATED_FRIEND_INVITATION", (new_data) => {
				console.log("new friend invite !")
				data.friend_requests.incoming = [new_data, ...data.friend_requests.incoming]
			}),
			addListenerToEventSource($sse_store, "CREATED_CHAN_INVITATION", (new_data) => {
				console.log("new chan invite !")
				data.chan_invites.incoming = [new_data, ...data.chan_invites.incoming]
			}),
		)

		return () => {
			destroyer.forEach((func) => func())
		}
	})

	async function acceptFriendInvitation(e: MouseEvent & { currentTarget: HTMLButtonElement }) {
		const id = e.currentTarget.dataset.id
		if (id) {
			const { status, body } = await client.invitations.friend.updateFriendInvitation({
				params: { id },
				body: { status: "ACCEPTED" },
			})
			if (status >= 400) {
				const message = `Could not accept friend request. Server returned code ${status}\n with message \"${
					(body as any)?.message
				}\"`
				makeToast(message, toastStore)
				console.error(message)
			} else invalidate(":friends:invitations")
		}
	}

	async function declineFriendInvitation(e: MouseEvent & { currentTarget: HTMLButtonElement }) {
		const id = e.currentTarget.dataset.id
		if (id) {
			const { status, body } = await client.invitations.friend.updateFriendInvitation({
				params: { id },
				body: { status: "REFUSED" },
			})
			if (status != 200) {
				const message = `Could not decline friend request. Server returned code ${status}\n with message \"${
					(body as any)?.message
				}\"`
				makeToast(message, toastStore)
				console.error(message)
			} else invalidate(":friends:invitations")
		}
	}

	async function acceptChanInvitation(e: MouseEvent & { currentTarget: HTMLButtonElement }) {
		const id = e.currentTarget.dataset.id
		if (id) {
			const { status, body } = await client.invitations.chan.updateChanInvitation({
				params: { id },
				body: { status: "ACCEPTED" },
			})
			if (status >= 400) {
				const message = `Could not accept friend request. Server returned code ${status}\n with message \"${
					(body as any)?.message
				}\"`
				makeToast(message, toastStore)
				console.error(message)
			} else invalidate(":chans:invitations")
		}
	}

	async function declineChanInvitation(e: MouseEvent & { currentTarget: HTMLButtonElement }) {
		const id = e.currentTarget.dataset.id
		if (id) {
			const { status, body } = await client.invitations.chan.updateChanInvitation({
				params: { id },
				body: { status: "REFUSED" },
			})
			if (status != 201) {
				const message = `Could not decline chan invite. Server returned code ${status}\n with message \"${
					(body as any)?.message
				}\"`
				makeToast(message, toastStore)
				console.error(message)
			} else invalidate(":chans:invitations")
		}
	}

	function messageFriend(e: Event) {
		// client.dms.getDmIdWithName(e.detail)
	}

	console.log("Your friendships are:", data.friendships)
	console.log(tableMapperValues(data.friendships, ["friendName"]))

	let friendTableSource: TableSource
	$: friendTableSource = {
		// A list of heading labels.
		head: ["Friends"],
		// The data visibly shown in your table body UI.
		body: tableMapperValues(data.friendships, ["friendName"]),
	}
</script>

<div class="grid grid-cols-2">
	{#if data.chan_invites.incoming.length != 0}
		<ul class="variant-ringed-primary m-3 rounded-xl">
			Pending chan invitations:
			{#each data.chan_invites.incoming as request}
				<li class="variant-soft chip m-2">
					<span>
						{request.invitingDisplayName} invited you to the {request.chanTitle} channel :
					</span>
					<button
						data-id={request.id}
						class="variant-ghost-primary chip"
						on:click={acceptChanInvitation}>✅</button
					>
					<button
						data-id={request.id}
						class="variant-ghost-error chip"
						on:click={declineChanInvitation}>❌</button
					>
				</li>
			{/each}
		</ul>
	{:else}
		<div
			class="variant-ringed-primary m-3 rounded-xl p-7 text-center text-xl font-bold text-gray-400"
		>
			You have no pending chan invitations
		</div>
	{/if}
	{#if data.friend_requests.incoming.length != 0}
		<ul class="variant-ringed-secondary m-3 rounded-xl">
			Pending friend invitations:
			{#each data.friend_requests.incoming as request}
				<li class="variant-soft chip m-2">
					<span>
						{request.invitedDisplayName}
					</span>
					<button
						data-id={request.id}
						class="variant-ghost-primary chip"
						on:click={acceptFriendInvitation}>✅</button
					>
					<button
						data-id={request.id}
						class="variant-ghost-error chip"
						on:click={declineFriendInvitation}>❌</button
					>
				</li>
			{/each}
		</ul>
	{:else}
		<div
			class="variant-ringed-secondary m-3 rounded-xl p-7 text-center text-xl font-bold text-gray-400"
		>
			You have no pending friend request
		</div>
	{/if}
</div>

<div class="my-5 flex items-center justify-center">
	<SendFriendRequest />
</div>

{#if friendTableSource.body.length > 0}
	<div class="flex items-center justify-center">
		<Table source={friendTableSource} interactive={true} on:selected={messageFriend} />
	</div>
{:else}
	<div
		class="variant-ringed-tertiary m-3 rounded-xl p-7 text-center text-xl font-bold text-gray-400"
	>
		No frienships yet
	</div>
{/if}

<style>
</style>
