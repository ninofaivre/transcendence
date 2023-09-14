<script lang="ts">
	import type { PageData } from "./$types"
	import type { MatchHistory } from "$types"
	import {
		Table,
		type PaginationSettings,
		type TableSource,
		tableMapperValues,
		ProgressRadial,
	} from "@skeletonlabs/skeleton"

	import { PUBLIC_BACKEND_URL } from "$env/static/public"
	import { client } from "$clients"
	import { getModalStore, type ModalSettings } from "@skeletonlabs/skeleton"
	import { page } from "$app/stores"
	import { Paginator } from "@skeletonlabs/skeleton"
	import { goto, invalidate } from "$app/navigation"
	import { getContext, onDestroy } from "svelte"
	import ProfilePicture from "$components/ProfilePicture.svelte"
	import type { Writable } from "svelte/store"
	import { addListenerToEventSource } from "$lib/global"

	export let data: PageData

	const modalStore = getModalStore()
	const checkError: (ret: { status: number; body: any }, what: string) => void = (window as any)
		.checkError
	const makeToast: (message: string) => void = (window as any).makeToast

	let already_friend: boolean
	$: already_friend = data.friendList.includes($page.params.username)

	let spin = false
	let keep_loading = true

	$: {
		if (data.me.userName === data.user.userName) goto("/myprofile")
	}

	const game_socket = getContext("game_socket")

	async function askFriend() {
		const ret = await client.invitations.friend.createFriendInvitation({
			body: { invitedUserName: data.user.userName },
		})
		if (ret.status != 201) checkError(ret, "send friend request")
		else {
			makeToast("Sent friend request to " + data.user.displayName)
			// invalidate("app:friends:invitations")
			invalidate("app:user")
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
			if (ret.status != 204) checkError(ret, "send friend request")
			else {
				makeToast("Revoked friendship with " + data.user.displayName)
				invalidate("app:friends")
			}
		} else throw new Error("There is no friendShipId for this user")
	}

	async function inviteToGame() {
		const modal: ModalSettings = {
			type: "component",
			component: "WaitForGameModal",
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
				Winner: obj.winnerDisplayName,
				"Winning Score": obj.winnerScore,
				Looser: obj.looserDisplayName,
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
			if (ret.status !== 200) checkError(ret, "load match history")
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
		if (ret.status != 201) checkError(ret, "block " + username)
		else {
			makeToast("Blocked " + data.user.displayName)
			invalidate("app:user")
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
		if (ret.status != 204) checkError(ret, "remove block over " + username)
		else {
			makeToast("Unblocked " + data.user.displayName)
			invalidate("app:user")
		}
	}

	$: nPlayed = data.user.nWin + data.user.nLoose

	async function acceptFriendRequest() {
		if (data.user.invitedId) {
			const { status, body } = await client.invitations.friend.updateFriendInvitation({
				params: { id: data.user.invitedId },
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

	let sse_store: Writable<EventSource> = getContext("sse_store")
	const destroy_me = new Array(
		addListenerToEventSource($sse_store, "BLOCKED_USER", () => {
			invalidate("app:user")
		}),
		addListenerToEventSource($sse_store, "UNBLOCKED_USER", () => {
			invalidate("app:user")
		}),
		addListenerToEventSource($sse_store, "CREATED_FRIEND_INVITATION", () => {
			invalidate("app:user")
		}),
		addListenerToEventSource($sse_store, "UPDATED_FRIEND_INVITATION_STATUS", () => {
			invalidate("app:user")
		}),
		addListenerToEventSource($sse_store, "CREATED_FRIENDSHIP", () => {
			invalidate("app:user")
			invalidate("app:friends")
		}),
		addListenerToEventSource($sse_store, "DELETED_FRIENDSHIP", () => {
			invalidate("app:user")
			invalidate("app:friends")
		}),
		addListenerToEventSource($sse_store, "BLOCKED_BY_USER", () => {
			invalidate("app:user")
		}),
		addListenerToEventSource($sse_store, "UNBLOCKED_BY_USER", () => {
			invalidate("app:user")
		}),
	)
	onDestroy(() => destroy_me.forEach((func) => func()))
</script>

<!-- Container -->
<div class="my-6 sm:mx-auto sm:w-full sm:max-w-xl">
	<!-- Card -->
	<div class="flex flex-row gap-2 rounded-lg bg-gray-100 p-8 sm:px-10">
		<!-- User basic info -->
		<div class="flex flex-1 flex-col gap-2">
			<!-- col1: Profile picture + menu -->
			<ProfilePicture
				src="{PUBLIC_BACKEND_URL}/api/users/{data.user.userName}/profilePicture?id={data
					.user.userName}"
				fallback="https://i.pravatar.cc/?u={data.user.userName}"
			/>
			<!-- Block | Remove block -->
			<div class="flex-1">
				{#if data.user.blockedId}
					<button class="variant-filled-warning btn btn-sm h-fit" on:click={unblockUser}>
						Remove Block
					</button>
				{:else if data.user.invitingId || !already_friend}
					<button
						class="variant-filled-warning btn btn-sm h-fit"
						on:click={blockUser}
						disabled={already_friend}
					>
						🚫 Block
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
					🎮 Invite to a Game
				</button>
			</div>

			<!-- Send friend request | Accept Invitation | Invitation sent | Revoke Friendship -->
			<div class="flex-1">
				{#if data.user.invitingId}
					<p class="variant-filled-warning w-fit rounded-full px-2 py-1 text-sm">
						🤝 Friend request sent
					</p>
				{:else if data.user.invitedId}
					<button
						class="variant-filled-error btn btn-sm h-fit"
						on:click={acceptFriendRequest}
					>
						🤝 Accept friend request
					</button>
				{:else if already_friend}
					<button class="variant-filled-error btn btn-sm h-fit" on:click={revokeFriend}>
						Revoke Friendship
					</button>
				{:else}
					<button
						class="variant-filled-primary btn btn-sm h-fit"
						disabled={data.user.blockedId || data.user.blockedById ? true : false}
						on:click={askFriend}
						>🤝 Send Friend Request
					</button>
				{/if}
			</div>
		</div>

		<!-- col2 : Name + stats-->
		<div class="flex flex-1 flex-col" style:font-family="ArcadeClassic">
			<!-- Name  -->
			<h1 class="text-4xl text-black">{data.user.displayName}</h1>
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
