<script lang="ts">
	import type { TableSource } from "@skeletonlabs/skeleton"

	import { page } from "$app/stores"
	import { Table } from "@skeletonlabs/skeleton"
	import { tableMapperValues } from "@skeletonlabs/skeleton"
	import type { ClientInferResponseBody } from "@ts-rest/core"
	import type contract from "$contract"
	import { friendsClient, invitationsClient } from "$clients"
	import { toastStore } from "@skeletonlabs/skeleton"
	import { my_name } from "$stores"
	import SendFriendRequest from "./SendFriendRequest.svelte"

	async function acceptInvitation(e: MouseEvent & { currentTarget: HTMLButtonElement }) {
		const idString = e.currentTarget.dataset.id
		if (idString) {
			const invitationId = Number(idString)
			const { status, body } = await friendsClient.acceptFriendInvitation({
				body: { invitationId },
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

	async function declineInvitation(_e: MouseEvent & { currentTarget: HTMLButtonElement }) {
		console.log("This has not been implemented yet")
	}

	type friendType = ClientInferResponseBody<typeof contract.friends.getFriends, 200>[number]

	const friendTableSource: TableSource = {
		// A list of heading labels.
		head: ["Friends"],
		// The data visibly shown in your table body UI.
		body: tableMapperValues(
			$page.data.friendships,
			$page.data.friendships.requestingUserName !== $my_name
				? ["requestingUserName"]
				: ["requestedUserName"],
		),
		// Optional: The data returned when interactive is enabled and a row is clicked.
		// meta: tableMapperValues($page.data.friends, ["position", "name", "symbol", "weight"]),
		// Optional: A list of footer labels.
		// foot: ["Total", "", '<code class="code">5</code>'],
	}
</script>

<SendFriendRequest />

<ul class="m-3">
	{#if $page.data.friend_requests.length != 0}
		Pending invitations:
		{#each $page.data.friend_requests as request}
			<li class="chip variant-soft m-2">
				<span>
					{request.invitingUserName}
				</span>
				<button
					data-id={request.id}
					class="variant-ghost-primary chip"
					on:click={acceptInvitation}>✅</button
				>
				<button data-id={request.id} class="variant-ghost-error chip">❌</button>
			</li>
		{/each}
	{:else}
		<p class="text-center text-2xl font-bold">You have no pending invitations</p>
	{/if}
</ul>

<Table source={friendTableSource} />

<style>
</style>
