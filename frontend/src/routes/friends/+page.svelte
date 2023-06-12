<script lang="ts">
	import type { TableSource } from "@skeletonlabs/skeleton"

	import { page } from "$app/stores"
	import { Table } from "@skeletonlabs/skeleton"
	import { tableMapperValues } from "@skeletonlabs/skeleton"
	import { dmsClient, invitationsClient } from "$clients"
	import { toastStore } from "@skeletonlabs/skeleton"
	import SendFriendRequest from "./SendFriendRequest.svelte"

	async function acceptInvitation(e: MouseEvent & { currentTarget: HTMLButtonElement }) {
		const id = e.currentTarget.dataset.id
		if (id) {
			const { status, body } = await invitationsClient.friend.updateFriendInvitation({
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
			}
		}
	}

	async function declineInvitation(e: MouseEvent & { currentTarget: HTMLButtonElement }) {
		const id = e.currentTarget.dataset.id
		if (id) {
			const { status, body } = await invitationsClient.friend.updateFriendInvitation({
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
			}
		}
	}

    function messageFriend(e: Event) {
        // dmsClient.getDmIdWithName(e.detail)
    }

	console.log("Your friendships are:", $page.data.friendships)
	console.log(tableMapperValues($page.data.friendships, ["friendName"]))

	const friendTableSource: TableSource = {
		// A list of heading labels.
		head: ["Friends"],
		// The data visibly shown in your table body UI.
		body: tableMapperValues(
			$page.data.friendships,
			["friendName"],
		),
	}

</script>

<SendFriendRequest />

<ul class="m-3">
	{#if $page.data.friend_requests.incoming.length != 0}
		Pending invitations:
		{#each $page.data.friend_requests.incoming as request}
			<li class="chip variant-soft m-2">
				<span>
					{request.invitingUserName}
				</span>
				<button
					data-id={request.id}
					class="variant-ghost-primary chip"
					on:click={acceptInvitation}>✅</button
				>
				<button
					data-id={request.id}
					class="variant-ghost-error chip"
					on:click={declineInvitation}>❌</button
				>
			</li>
		{/each}
	{:else}
		<div class="text-center text-2xl font-bold pb-8">You have no pending invitations</div>
	{/if}
</ul>

<Table source={friendTableSource} interactive={true} on:selected={messageFriend}/>

<style>
</style>
