<script lang="ts">
	import type { ModalSettings, TableSource } from "@skeletonlabs/skeleton"

	import { Table, getModalStore } from "@skeletonlabs/skeleton"
	import { tableMapperValues } from "@skeletonlabs/skeleton"
	import { client } from "$clients"
	import { invalidate } from "$app/navigation"
	import { addListenerToEventSource } from "$lib/global"
	import { getContext, onMount } from "svelte"
	import type { Writable } from "svelte/store"
	import type { PageData } from "./$types"

	// For some reason invalidate seems to work in this file, go figure
	export let data: PageData
	const sse_store: Writable<EventSource> = getContext("sse_store")
	const makeToast: (message: string) => void = (window as any).makeToast
	const checkError: (ret: { status: number; body: any }, what: string) => void = (window as any)
		.checkError
	const modalStore = getModalStore()

	onMount(() => {
		const destroyer = new Array(
            addListenerToEventSource($sse_store, "CREATED_FRIEND_INVITATION", () => {
                invalidate("app:friends:invitations")
            }),
            addListenerToEventSource($sse_store, "CREATED_FRIEND_INVITATION", () => {
                invalidate("app:friends:invitations")
            }),
            addListenerToEventSource($sse_store, "CREATED_CHAN_INVITATION", () => {
                invalidate("app:chans:invitations")
            }),
            addListenerToEventSource($sse_store, "UPDATED_CHAN_INVITATION_STATUS", () => {
                invalidate("app:chans:invitations")
            }),
            addListenerToEventSource($sse_store, "CREATED_FRIENDSHIP", () => {
                invalidate("app:friends")
            }),
            addListenerToEventSource($sse_store, "DELETED_FRIENDSHIP", () => {
                invalidate("app:friends")
            }),
		)

		return () => {
			destroyer.forEach((func) => func())
		}
	})

	async function acceptFriendInvitation(id: string) {
		if (id) {
			const { status, body } = await client.invitations.friend.updateFriendInvitation({
				params: { id },
				body: { status: "ACCEPTED" },
			})
			if (status >= 400) {
				const message = `Could not accept friend request. Server returned code ${status}\n with message \"${
					(body as any)?.message
				}\"`
				makeToast(message)
				console.error(message)
			} else invalidate("app:friends:invitations")
		}
	}

	async function declineFriendInvitation(id: string) {
		if (id) {
			const { status, body } = await client.invitations.friend.updateFriendInvitation({
				params: { id },
				body: { status: "REFUSED" },
			})
			if (status != 200) {
				const message = `Could not decline friend request. Server returned code ${status}\n with message \"${
					(body as any)?.message
				}\"`
				makeToast(message)
				console.error(message)
			} else invalidate("app:friends:invitations")
		}
	}

	async function acceptChanInvitation(id: string) {
		if (id) {
			const { status, body } = await client.invitations.chan.updateChanInvitation({
				params: { id },
				body: { status: "ACCEPTED" },
			})
			if (status >= 400) {
				const message = `Could not accept friend request. Server returned code ${status}\n with message \"${
					(body as any)?.message
				}\"`
				makeToast(message)
				console.error(message)
			} else invalidate("app:chans:invitations")
		}
	}

	async function declineChanInvitation(id: string) {
		if (id) {
			const { status, body } = await client.invitations.chan.updateChanInvitation({
				params: { id },
				body: { status: "REFUSED" },
			})
			if (status != 201) {
				const message = `Could not decline chan invite. Server returned code ${status}\n with message \"${
					(body as any)?.message
				}\"`
				makeToast(message)
				console.error(message)
			} else invalidate("app:chans:invitations")
		}
	}

	function messageFriend(e: Event) {
		// client.dms.getDmIdWithName(e.detail)
	}

	let friendTableSource: TableSource
	$: friendTableSource = {
		// A list of heading labels.
		head: ["Friends"],
		// The data visibly shown in your table body UI.
		body: tableMapperValues(data.friendships, ["friendDisplayName"]),
	}

	async function onSendFriendRequest() {
		const username = await new Promise<string | undefined>((resolve) => {
			const modal: ModalSettings = {
				type: "component",
				component: "SendFriendRequestModal",
				response: (r) => {
					modalStore.close()
					resolve(r)
				},
			}
			modalStore.trigger(modal)
		})
		if (username) {
			const ret = await client.invitations.friend.createFriendInvitation({
				body: { invitedUserName: username },
			})
			if (ret.status != 201) {
				checkError(ret, "create friend request")
			} else {
				invalidate("app:friendships")
				makeToast("Friend request sent")
			}
		}
	}
</script>

<div class="grid grid-cols-2">
	<fieldset class="variant-ringed-primary list m-3 rounded-xl p-3 text-gray-400">
		<legend class="variant-filled-primary rounded px-3">Chan invitations</legend>
		{#if data.chan_invites.incoming.length != 0}
			{#each data.chan_invites.incoming as request}
				<li class="list-item">
					<span class="p-0">
						<a
							href="/users/{request.invitingDisplayName}"
							class="variant-soft btn rounded p-1 font-bold text-gray-500"
						>
							{request.invitingDisplayName}
						</a>
						invited you to {request.chanTitle}
					</span>
					<button
						class="variant-ghost-primary chip px-2"
						on:click={() => acceptChanInvitation(request.id)}>✅ Join chan</button
					>
					<button
						class="variant-ghost-error chip px-2"
						on:click={() => declineChanInvitation(request.id)}>❌ Decline</button
					>
				</li>
			{/each}
		{:else}
			<div class="p-7 text-center text-xl font-bold text-gray-400">
				You have no pending chan invitations
			</div>
		{/if}
	</fieldset>
	<fieldset class="variant-ringed-secondary list m-3 rounded-xl p-3 text-gray-400">
		<legend class="variant-filled-secondary rounded px-3">Friend requests</legend>

		{#if data.friend_requests.incoming.length != 0}
			{#each data.friend_requests.incoming as request}
				<li class="list-item">
					<span class="p-0">
						<a
							href="/users/{request.invitingDisplayName}"
							class="variant-soft btn rounded p-1 font-bold text-gray-500"
						>
							{request.invitingDisplayName}
						</a>
						sent a friend request
					</span>
					<button
						data-id={request.id}
						class="variant-ghost-primary chip px-2"
						on:click={() => acceptFriendInvitation(request.id)}>✅ Accept</button
					>
					<button
						data-id={request.id}
						class="variant-ghost-error chip px-2"
						on:click={() => declineFriendInvitation(request.id)}>❌ Reject</button
					>
				</li>
			{/each}
		{:else}
			<div class="p-7 text-center text-xl font-bold text-gray-400">
				You have no pending friend request
			</div>
		{/if}
	</fieldset>
</div>

<fieldset class="variant-ringed-tertiary m-3 rounded-xl p-7 text-gray-400"
>
    <legend class="variant-filled-tertiary px-3 rounded">
        Friends
    </legend>
    {#if friendTableSource.body.length > 0}
        <div class="flex items-center justify-center">
            <Table source={friendTableSource} interactive={true} on:selected={messageFriend} />
        </div>
    {:else}
        <div class="text-center text-xl font-bold">
            No friendships yet
        </div>
    {/if}
</fieldset>

<style>
</style>
