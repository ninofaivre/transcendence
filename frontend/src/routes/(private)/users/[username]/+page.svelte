<script lang="ts">
	import type { PageData } from "./$types"
	import type { PaginationSettings } from "@skeletonlabs/skeleton"

	import { PUBLIC_BACKEND_URL } from "$env/static/public"
	import { Avatar } from "@skeletonlabs/skeleton"
	import { client } from "$clients"
	import { isContractError } from "contract"
	import { checkError, makeToast } from "$lib/global"
	import { getModalStore, type ModalSettings } from "@skeletonlabs/skeleton"
	import { page } from "$app/stores"
	import { SlideToggle } from "@skeletonlabs/skeleton"
	import { Paginator } from "@skeletonlabs/skeleton"

	export let data: PageData

	const modalStore = getModalStore()
	let invite_state: null | "pending" | "accepted"
	let already_friend: boolean = data.friendList.includes($page.params.username)
	let twoFA: boolean = false
	// let twoFA: boolean = data.twoFA

	async function askFriend() {
		const ret = await client.invitations.friend.createFriendInvitation({
			body: { invitedUserName: data.user.userName },
		})
		if (ret.status != 201) checkError(ret, "send friend request")
		else makeToast("Sent friend request to " + data.user.userName)
	}

	async function revokeFriend() {
		alert("Not implemented")
	}

	async function inviteToGame() {
		const modal: ModalSettings = {
			type: "component",
			component: "WaitForGame",
			response: () => {
				modalStore.close()
			},
			meta: { username: $page.params.username },
		}
		modalStore.trigger(modal)
	}

	const source = ["1", "2", "3"]
	let paginationSettings = {
		page: 0,
		limit: 5,
		size: data.match_history.length,
		amounts: [1, 2, 5, 10],
	} satisfies PaginationSettings

	function onAmountChange(e: CustomEvent) {
		console.log(e.detail)
	}

	function onPageChange(e: CustomEvent) {
		console.log(e.detail)
	}
</script>

<div class="mt-28 sm:mx-auto sm:w-full sm:max-w-md">
	<div class="flex flex-col gap-2 rounded-lg bg-gray-50 p-8 sm:px-10">
		<!-- Avatar -->
		<div class="grid flex-1 grid-cols-2">
			<!-- col1 -->
			<Avatar
				src="{PUBLIC_BACKEND_URL}/users/{data.user.userName}/profilePicture"
				fallback="https://i.pravatar.cc/?u={data.user.userName}"
				alt="profile"
			/>
			<!-- col2 -->
			<h1 class="self-center text-black">{data.user.userName}</h1>
		</div>

		<!-- Send Friend Request -->
		<div class="flex-1">
			{#if invite_state}
				<p>
					{`You friend request has been ${invite_state}`}
				</p>
			{:else if already_friend}
				<button class="variant-filled-error btn btn-sm h-fit" on:click={revokeFriend}
					>Revoke friendship</button
				>
			{:else}
				<button class="variant-filled-primary btn btn-sm h-fit" on:click={askFriend}
					>Send friend request</button
				>
			{/if}
		</div>

		<div class="flex-1">
			<SlideToggle class="text-black" name="slider-label" checked={twoFA}
				>2FA Authentication</SlideToggle
			>
		</div>
	</div>

	<Paginator
		bind:settings={paginationSettings}
		on:page={onPageChange}
		on:amount={onAmountChange}
	/>
</div>
