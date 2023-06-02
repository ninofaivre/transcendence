<script lang="ts">
	import type { TableSource } from "@skeletonlabs/skeleton"

	import { page } from "$app/stores"
	import { Table } from "@skeletonlabs/skeleton"
	import { tableMapperValues } from "@skeletonlabs/skeleton"
	import type { ClientInferResponseBody } from "@ts-rest/core"
	import type contract from "$contract"
	import { friendsClient, invitationsClient } from "$clients"
	import { toastStore } from "@skeletonlabs/skeleton"

	let invitee: string

	let friend_request_form: HTMLFormElement
	async function sendFriendRequest() {
		const username = new FormData(friend_request_form).get("invitee")! as string
		const { status, body } = await invitationsClient.createFriendInvitation({
			body: { username },
		})
		if (status != 201) {
			const message = `Could not create new discussion channel. Server returned code ${status}\n with message \"${
				(body as any)?.message
			}\"`
			toastStore.trigger({
				message,
			})
			console.error(message)
		}
	}

	async function acceptInvitation(e: MouseEvent & { currentTarget: HTMLButtonElement }) {
		const idString = e.currentTarget.dataset.id
		if (idString) {
			const invitationId = Number(idString)
			const { status, body } = await friendsClient.acceptFriendInvitation({
				body: { invitationId },
			})
			if (status != 201) {
				const message = `Could not create new discussion channel. Server returned code ${status}\n with message \"${
					(body as any)?.message
				}\"`
				toastStore.trigger({
					message,
				})
				console.error(message)
			}
		}
	}

	async function declineInvitation(_e: MouseEvent & { currentTarget: HTMLButtonElement }) {
		console.log("This has not been implemented yet")
	}

	type friendType = ClientInferResponseBody<typeof contract.friends.getFriends, 200>[number]

	console.log("Your friends are:", $page.data.friends)

	const friendTableSource: TableSource = {
		// A list of heading labels.
		head: ["Name", "username"],
		// The data visibly shown in your table body UI.
		body: tableMapperValues($page.data.friends, ["name", "username"]),
		// Optional: The data returned when interactive is enabled and a row is clicked.
		// meta: tableMapperValues($page.data.friends, ["position", "name", "symbol", "weight"]),
		// Optional: A list of footer labels.
		// foot: ["Total", "", '<code class="code">5</code>'],
	}
</script>

<div class="m-14">
	<form
		method="POST"
		on:submit|preventDefault={sendFriendRequest}
		bind:this={friend_request_form}
	>
		<label for="invitee" class="label mx-3"> Send friendship request </label>
		<input
			bind:value={invitee}
			name="invitee"
			id="invitee"
			type="text"
			required
			class="input m-3"
		/>
		<button id="login" type="submit" class="variant-filled-success btn m-3">
			Send friend request
		</button>
	</form>
</div>
<div>
	Pending invitations:
	{#each $page.data.friend_requests as request}
		<div>
			{request}
			<button
				data-id={request.id}
				class="variant-ghost-primary btn"
				on:click={acceptInvitation}>V</button
			>
			<button data-id={request.id} class="variant-ghost-error btn">X</button>
		</div>
	{/each}
</div>

<div>
	Your friends:
	{#each $page.data.friends as friend}
		<div>
			{friend}
		</div>
	{/each}
</div>

<Table source={friendTableSource} />

<style>
</style>
