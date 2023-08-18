<script lang="ts">
	import type { PageData } from "./$types"
	import { PUBLIC_BACKEND_URL } from "$env/static/public"
	import { Avatar } from "@skeletonlabs/skeleton"
	import { client } from "$clients"
	import { isContractError } from "contract"
	import { checkError, makeToast } from "$lib/global"

	export let data: PageData

	let invite_state: null | "pending" | "accepted"

	async function askFriend() {
		const ret = await client.invitations.friend.createFriendInvitation({
			body: { invitedUserName: data.username },
		})
		if (ret.status != 201) checkError(ret, "send friend request")
		else makeToast("Sent friend request to " + data.username)
	}
</script>

<div class="mt-28 sm:mx-auto sm:w-full sm:max-w-md">
	<div class="grid grid-rows-2 gap-2 rounded-lg bg-gray-50 p-8 sm:px-10">
		<!-- row1 -->
		<div class="grid grid-cols-2">
			<!-- col1 -->
			<Avatar
				src="{PUBLIC_BACKEND_URL}/users/{data.username}/profilePicture"
				fallback="https://i.pravatar.cc/?u={data.username}"
				alt="profile"
			/>
			<!-- col2 -->
			<h1 class="self-center text-black">{data.username}</h1>
		</div>

		<!-- row2 -->
		{#if invite_state}
			<p>
				{`You friend request has been ${invite_state}`}
			</p>
		{:else}
			<button class="btn btn-sm variant-filled" on:click={askFriend}
				>Send friend request</button
			>
		{/if}
	</div>
</div>
