<script lang="ts">
	import type { TableSource } from "@skeletonlabs/skeleton"

	import { page } from "$app/stores"
	import { Table } from "@skeletonlabs/skeleton"
	import { tableMapperValues } from "@skeletonlabs/skeleton"
	import { client } from "$clients"
	import { toastStore } from "@skeletonlabs/skeleton"
	import SendFriendRequest from "$lib/SendFriendRequest.svelte"
	import { invalidate } from "$app/navigation"
	import CreateDiscussion from "$lib/CreateDiscussion.svelte"

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
				toastStore.trigger({
					message,
				})
				console.error(message)
			} else invalidate(":friends:invitations")
		}
	}

	async function declineFriendInvitation(e: MouseEvent & { currentTarget: HTMLButtonElement }) {
		const id = e.currentTarget.dataset.id
		if (id) {
			const { status, body } = await client.invitations.chan.updateChanInvitation({
				params: { id },
				body: { status: "REFUSED" },
			})
			if (status != 201) {
				const message = `Could not accept friend request. Server returned code ${status}\n with message \"${
					(body as any)?.message
				}\"`
				toastStore.trigger({
					message,
				})
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
				toastStore.trigger({
					message,
				})
				console.error(message)
			} else invalidate(":chans:invitations")
		}
	}

	async function declineChanInvitation(e: MouseEvent & { currentTarget: HTMLButtonElement }) {
		const id = e.currentTarget.dataset.id
		if (id) {
			const { status, body } = await client.invitations.friend.updateFriendInvitation({
				params: { id },
				body: { status: "REFUSED" },
			})
			if (status != 201) {
				const message = `Could not accept friend request. Server returned code ${status}\n with message \"${
					(body as any)?.message
				}\"`
				toastStore.trigger({
					message,
				})
				console.error(message)
			} else invalidate(":chans:invitations")
		}
	}

	function messageFriend(e: Event) {
		// client.dms.getDmIdWithName(e.detail)
	}

	console.log("Your friendships are:", $page.data.friendships)
	console.log(tableMapperValues($page.data.friendships, ["friendName"]))

	let friendTableSource: TableSource
	$: friendTableSource = {
		// A list of heading labels.
		head: ["Friends"],
		// The data visibly shown in your table body UI.
		body: tableMapperValues($page.data.friendships, ["friendName"]),
	}
</script>

<SendFriendRequest />

<ul class="m-3">
	{#if $page.data.chan_invites.incoming.length != 0}
		Pending chan invitations:
		{#each $page.data.chan_invites.incoming as request}
			<li class="chip variant-soft m-2">
				<span>
					{request.invitingUserName} invited you to the {request.chanTitle} channel :
				</span>
				<button
					data-id={request.id}
					class="chip variant-ghost-primary"
					on:click={acceptChanInvitation}>✅</button
				>
				<button
					data-id={request.id}
					class="chip variant-ghost-error"
					on:click={declineChanInvitation}>❌</button
				>
			</li>
		{/each}
	{:else}
		<div class="pb-8 text-center text-2xl font-bold">You have no pending chan invitations</div>
	{/if}
</ul>

<ul class="m-3">
	{#if $page.data.friend_requests.incoming.length != 0}
		Pending friend invitations:
		{#each $page.data.friend_requests.incoming as request}
			<li class="chip variant-soft m-2">
				<span>
					{request.invitingUserName}
				</span>
				<button
					data-id={request.id}
					class="chip variant-ghost-primary"
					on:click={acceptFriendInvitation}>✅</button
				>
				<button
					data-id={request.id}
					class="chip variant-ghost-error"
					on:click={declineFriendInvitation}>❌</button
				>
			</li>
		{/each}
	{:else}
		<div class="pb-8 text-center text-2xl font-bold">You have no pending friend request</div>
	{/if}
</ul>

<Table source={friendTableSource} interactive={true} on:selected={messageFriend} />

<style>
</style>
