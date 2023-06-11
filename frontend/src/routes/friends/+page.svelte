<script lang="ts">
	import type { TableSource } from "@skeletonlabs/skeleton"

	import { page } from "$app/stores"
	import { Table } from "@skeletonlabs/skeleton"
	import { tableMapperValues } from "@skeletonlabs/skeleton"
	import { invitationsClient } from "$clients"
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

	$: friendships = $page.data.friendships
	console.log("Your friendships are:", $page.data.friendships)

	const friendTableSource: TableSource = {
		// A list of heading labels.
		head: ["Friends"],
		// The data visibly shown in your table body UI.
		body: tableMapperValues(
			$page.data.friendships,
			["friendName"], // This is ofc incorrect, waiting for the right field, probably "friendName"
		),
		// Optional: The data returned when interactive is enabled and a row is clicked.
		// meta: tableMapperValues($page.data.friends, ["position", "name", "symbol", "weight"]),
		// Optional: A list of footer labels.
		// foot: ["Total", "", '<code class="code">5</code>'],
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
		<p class="text-center text-2xl font-bold">You have no pending invitations</p>
	{/if}
</ul>

<Table source={friendTableSource} />

<style>
</style>
