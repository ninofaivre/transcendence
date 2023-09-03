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
	import { my_name } from "$stores"
	import { goto } from "$app/navigation"

	export let data: PageData

	const modalStore = getModalStore()
	const toastStore = getToastStore()
	let invite_state: null | "pending" | "accepted"
	let already_friend: boolean = data.friendList.includes($page.params.username)
	let spin = false
	let keep_loading = true
	let my_profile: boolean
	$: my_profile = $my_name === data.user.userName

	if (my_profile) goto("/myprofile")

	async function askFriend() {
		const ret = await client.invitations.friend.createFriendInvitation({
			body: { invitedUserName: data.user.userName },
		})
		if (ret.status != 201) checkError(ret, "send friend request", toastStore)
		else {
			makeToast("Sent friend request to " + data.user.userName, toastStore)
		}
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
					// alert("After this one, no more data")
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
            }
        })
        if (ret.status != 201) checkError(ret, "block " + username, toastStore)
        else {
            makeToast("Blocked " + username , toastStore)
        }
	}

	async function unblockUser() {
        const username = data.user.userName
        const ret = await client.users.unBlockUser({
            query: {
                username,
            },
            body: null
        })
        if (ret.status != 201) checkError(ret, "remove block over " + username, toastStore)
        else {
            makeToast("Unblocked " + username , toastStore)
        }
	}

	$: nPlayed = data.user.nWin + data.user.nLoose
	$: winRate = (data.user.nWin / nPlayed) * 100
</script>

<!-- Container -->
<div class="mt-10 sm:mx-auto sm:w-full sm:max-w-xl">
	<!-- Card -->
	<div class="flex flex-row gap-2 rounded-lg bg-gray-100 p-8 sm:px-10">
		<!-- User basic info -->
		<div class="flex flex-1 flex-col gap-2">
			<!-- col1: Avatar + menu -->
			<Avatar
				src="{PUBLIC_BACKEND_URL}/users/{data.user.userName}/profilePicture"
				fallback="https://i.pravatar.cc/?u={data.user.userName}"
				alt="profile"
			/>
			<!-- Block -->
			<div class="flex-1">
				{#if data.user.blockedId}
					<button class="variant-filled-warning btn btn-sm h-fit" on:click={unblockUser}>
						Remove Block
					</button>
				{:else if invite_state !== "pending" || !already_friend}
					<button class="variant-filled-error btn btn-sm h-fit" on:click={blockUser}>
						Block
					</button>
				{/if}
			</div>
			<!-- Game invite -->
			<div class="flex-1">
				{#if !data.user.blockedId || data.user.blockedById}
					<button class="variant-filled-warning btn btn-sm h-fit" on:click={inviteToGame}>
						Invite to a Game
					</button>
				{/if}
			</div>
			<!-- Send friend request -->
			<div class="flex-1">
				{#if invite_state}
					<p>
						{`You friend request has been ${invite_state}`}
					</p>
				{:else if already_friend}
					<button class="variant-filled-error btn btn-sm h-fit" on:click={revokeFriend}
						>Revoke Friendship
					</button>
				{:else}
					<button
						class="variant-filled-primary btn btn-sm h-fit"
						disabled={data.user.blockedById ? true : false}
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
						<ProgressRadial font={160} width="w-20" value={100} fill="">
							{nPlayed}
						</ProgressRadial>
					</div>
				</div>
				<div class="flex flex-1 flex-col items-center">
					<p class="">Win ratio</p>
					<div class="flex-1">
						<ProgressRadial
							font={160}
							width="w-20"
							value={winRate}
							fill="variant-filled-primary"
						>
							{`${winRate}/100`}
						</ProgressRadial>
					</div>
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
