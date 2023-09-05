<script lang="ts">
	import type { PageData } from "./$types"
	import type { MatchHistoryElement, MatchHistory } from "$types"
	import {
		Table,
		type PaginationSettings,
		type TableSource,
		tableMapperValues,
		getToastStore,
		ProgressRadial,
	} from "@skeletonlabs/skeleton"

	import { PUBLIC_BACKEND_URL } from "$env/static/public"
	import { Avatar } from "@skeletonlabs/skeleton"
	import { client } from "$clients"
	import { checkError, makeToast } from "$lib/global"
	import { getModalStore, type ModalSettings } from "@skeletonlabs/skeleton"
	import { page } from "$app/stores"
	import { Paginator } from "@skeletonlabs/skeleton"
	import { goto, invalidate } from "$app/navigation"
	import { reload_img } from "$stores"
	import { getContext } from "svelte"

	export let data: PageData

	const modalStore = getModalStore()
	const toastStore = getToastStore()
	let friend_invite_state: null | "pending" | "accepted"

	let already_friend: boolean
	$: already_friend = data.friendList.includes($page.params.username)

	console.log(data.friendList)
	console.log(data.friendships)
	let spin = false
	let keep_loading = true
	let my_profile: boolean
	$: my_profile = data.me.userName === data.user.userName
	const game_socket = getContext("game_socket")

	if (my_profile) goto("/myprofile")

	async function askFriend() {
		const ret = await client.invitations.friend.createFriendInvitation({
			body: { invitedUserName: data.user.userName },
		})
		if (ret.status != 201) checkError(ret, "send friend request", toastStore)
		else {
			makeToast("Sent friend request to " + data.user.userName, toastStore)
			//TODO either this works or I need another object back
			invalidate(":friends")
		}
	}

	async function revokeFriend() {
		const friendShipId =
			data.friendships.find((el) => el.friendName === data.user.userName)?.id ?? ""
		if (friendShipId) {
			const ret = await client.friends.deleteFriend({
				params: {
					friendShipId,
				},
				body: null,
			})
			if (ret.status != 204) checkError(ret, "send friend request", toastStore)
			else {
				makeToast("Revoked friendship with " + data.user.userName, toastStore)
				invalidate(":friends")
			}
		} else throw new Error("There is no friendShipId for this user")
	}

	async function inviteToGame() {
		const modal: ModalSettings = {
			type: "component",
			component: "WaitForGame",
			response: () => {
				modalStore.close()
			},
			meta: { username: $page.params.username, game_socket: game_socket },
		}
		modalStore.trigger(modal)
	}

	function remap(to_remap: MatchHistory) {
		return to_remap.map((obj) => {
			return {
				Date: new Date(obj.creationDate).toLocaleDateString("en-GB", {
					weekday: "long",
					year: "numeric",
					month: "short",
					day: "numeric",
					hour: "numeric",
					minute: "numeric",
					second: "numeric",
				}),
				Winner: obj.winnerName,
				"Winning Score": obj.winnerScore,
				Looser: obj.looserName,
				"Loosing Score": obj.looserScore,
				id: obj.id,
			}
		})
	}

	let settings: PaginationSettings = {
		page: 0,
		limit: 5,
		size: data.match_history.length,
		amounts: [5, 30, 100],
	}
	$: settings.size = match_history.length

	let match_history: ReturnType<typeof remap> = remap(data.match_history)

	let last_page_number: number
	$: last_page_number = Math.ceil(match_history.length / settings.limit)

	let last_match_history_element_id: string
	$: last_match_history_element_id = match_history.at(-1)?.id ?? ""

	// This does not need to be reactive
	let fields: string[] =
		match_history.length > 0 ? Object.keys(match_history[0]).filter((el) => el !== "id") : []

	let paginated_match_history: typeof match_history
	$: {
		paginated_match_history = match_history.slice(
			settings.page * settings.limit,
			settings.page * settings.limit + settings.limit,
		)
		paginated_match_history = paginated_match_history
	}

	let table_source: TableSource
	$: table_source = {
		// A list of heading labels.
		head: fields,
		// The data visibly shown in your table body UI.
		body: tableMapperValues(paginated_match_history, fields),
	}

	async function onPageChange(e: CustomEvent) {
		if (keep_loading == false) return
		if (last_page_number === e.detail + 1) {
			spin = true
			const ret = await client.game.getMatchHistory({
				params: { username: data.user.userName },
				query: {
					nMatches: settings.limit,
					cursor: last_match_history_element_id,
				},
			})
			if (ret.status !== 200) checkError(ret, "load match history", getToastStore())
			else {
				if (ret.body.length < settings.limit) {
					keep_loading = false
				}
				match_history = [...match_history, ...remap(ret.body)]
			}
			spin = false
		}
	}

	async function blockUser() {
		const username = data.user.userName
		const ret = await client.users.blockUser({
			body: {
				username,
			},
		})
		if (ret.status != 201) checkError(ret, "block " + username, toastStore)
		else {
			makeToast("Blocked " + username, toastStore)
			invalidate(":user")
		}
	}

	async function unblockUser() {
		const username = data.user.userName
		const ret = await client.users.unBlockUser({
			query: {
				username,
			},
			body: null,
		})
		if (ret.status != 204) checkError(ret, "remove block over " + username, toastStore)
		else {
			makeToast("Unblocked " + username, toastStore)
			invalidate(":user")
		}
	}

	$: nPlayed = data.user.nWin + data.user.nLoose
</script>

<!-- Container -->
<div class="my-6 sm:mx-auto sm:w-full sm:max-w-xl">
	<!-- Card -->
	<div class="flex flex-row gap-2 rounded-lg bg-gray-100 p-8 sm:px-10">
		<!-- User basic info -->
		<div class="flex flex-1 flex-col gap-2">
			<!-- col1: Avatar + menu -->
			<Avatar
				src="{PUBLIC_BACKEND_URL}/api/users/{data.user
					.userName}/profilePicture?reload={$reload_img}"
				fallback="https://i.pravatar.cc/?u={data.user.userName}"
				alt="profile"
			/>
			<!-- Block -->
			<div class="flex-1">
				{#if data.user.blockedId}
					<button class="variant-filled-error btn btn-sm h-fit" on:click={unblockUser}>
						Remove Block
					</button>
				{:else if friend_invite_state !== "pending" || !already_friend}
					<button
						class="variant-filled-error btn btn-sm h-fit"
						on:click={blockUser}
						disabled={already_friend}
					>
						Block
					</button>
				{/if}
			</div>
			<!-- Game invite -->
			<div class="flex-1">
				<button
					class="variant-filled-warning btn btn-sm h-fit"
					on:click={inviteToGame}
					disabled={data.user.blockedId || data.user.blockedById ? true : false}
				>
					Invite to a Game
				</button>
			</div>
			<!-- Send friend request -->
			<div class="flex-1">
				{#if friend_invite_state}
					<p>
						{`You friend request has been ${friend_invite_state}`}
					</p>
				{:else if already_friend}
					<button class="variant-filled-error btn btn-sm h-fit" on:click={revokeFriend}
						>Revoke Friendship
					</button>
				{:else}
					<button
						class="variant-filled-primary btn btn-sm h-fit"
						disabled={data.user.blockedId || data.user.blockedById ? true : false}
						on:click={askFriend}
						>Send Friend Request
					</button>
				{/if}
			</div>
		</div>

		<!-- col2 : Name + stats-->
		<div class="flex flex-1 flex-col" style:font-family="ArcadeClassic">
			<!-- Name  -->
			<h1 class="text-4xl text-black">{data.user.userName}</h1>
			<!-- Stats  -->
			<div class="flex flex-1 items-center text-black">
				<div class="flex flex-1 flex-col items-center">
					<div class="">Played</div>
					<div class="flex-1">
						<ProgressRadial font={140} width="w-24" value={100} fill="">
							{nPlayed}
						</ProgressRadial>
					</div>
				</div>
				<div class="flex flex-1 flex-col items-center">
					<p style:word-spacing={"0.2em"}>Win ratio</p>
					<ProgressRadial
						font={140}
						width="w-24"
						value={data.user.winRatePercentage}
						fill="variant-filled-primary"
					>
						{`${data.user.winRatePercentage}/100`}
					</ProgressRadial>
				</div>
			</div>
		</div>
	</div>
</div>
<div class="p-3">
	{#if match_history.length > 0}
		<Table source={table_source} />
		<Paginator bind:settings showNumerals on:page={onPageChange} />
	{:else}
		<div class="py-20 text-center text-3xl font-bold text-gray-500">No games to show yet</div>
	{/if}
</div>
{#if spin}
	<ProgressRadial class="absolute left-1/2 top-1/2" />
{/if}
