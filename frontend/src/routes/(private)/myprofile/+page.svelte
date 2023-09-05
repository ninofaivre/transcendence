<script lang="ts">
	import type { PaginationSettings } from "@skeletonlabs/skeleton"
	import type { MatchHistory } from "$types"
	import type { PageData } from "./$types"
	import type { TableSource } from "@skeletonlabs/skeleton"
	import type { ModalSettings } from "@skeletonlabs/skeleton"

	import { ProgressRadial, getModalStore } from "@skeletonlabs/skeleton"
	import { Avatar, Paginator, SlideToggle, Table, getToastStore } from "@skeletonlabs/skeleton"
	import { client } from "$clients"
	import { checkError, makeToast } from "$lib/global"
	import { isContractError } from "contract"
	import { tableMapperValues } from "@skeletonlabs/skeleton"
	import { PUBLIC_BACKEND_URL, PUBLIC_PROFILE_PICTURE_MAX_SIZE_MB } from "$env/static/public"

	import { reload_img } from "$stores"

	let _init = true
	export let data: PageData

	// 2FA
	let toastStore = getToastStore()
	let twoFA: boolean = data.me.enabledTwoFA
	let modalStore = getModalStore()

	async function setup2FA() {
		const code = await new Promise<string | undefined>((resolve) => {
			const modalSettings: ModalSettings = {
				image: twoFA ? PUBLIC_BACKEND_URL + "/api/users/@me/qr-code" : "",
				type: "prompt",
				response: (r) => {
					modalStore.close()
					resolve(r)
				},
			}
			modalStore.trigger(modalSettings)
		})
		let fetchMethod = twoFA ? client.users.enable2FA : client.users.disable2FA
		if (code) {
			if (twoFA) {
				const ret = await fetchMethod({
					body: { twoFAtoken: code },
				})
				if (ret.status !== 200) {
					checkError(ret, `${twoFA ? "enable" : "disable"} 2FA`, toastStore)
					twoFA = !twoFA
				}
			}
		} else twoFA = !twoFA
	}

	// Match Hisotry
	let keep_loading = true
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
			const ret = await client.game.getMatchHistory({
				params: { username: data.me.userName },
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
		}
	}

	// PP Upload
	let files: FileList
	$: files, console.log(files)

	async function onComplete(cropped_image_file: File) {
		const ret = await client.users.setMyProfilePicture({
			body: {
				profilePicture: cropped_image_file,
			},
		})
		if (ret.status === 204) {
			makeToast("Upload successful", toastStore)
			$reload_img = $reload_img + 1
		} else if (ret.status === 413) {
			makeToast(
				`Image is too big. Upload must be under ${PUBLIC_PROFILE_PICTURE_MAX_SIZE_MB}MB`,
				toastStore,
			)
		} else if (isContractError(ret)) {
			makeToast(`Upload failed: ${ret.body.message}`, toastStore)
		} else
			throw new Error(
				`Coulnd't upload profile picture. Unexpected return from the server: ${ret.status}`,
			)
	}

	async function triggerCropperModal() {
		const r = await new Promise<File | undefined>((resolve) => {
			const modalSettings: ModalSettings = {
				type: "component",
				component: "CropperModal",
				response: (r) => {
					modalStore.close()
					resolve(r)
				},
			}
			modalStore.trigger(modalSettings)
		})
		if (r) {
			onComplete(r)
		}
	}

	_init = false
</script>

<div class="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
	<div class="flex flex-col gap-3 rounded-lg bg-gray-50 p-8 sm:px-10">
		<!-- Avatar -->
		<div class="grid flex-1 grid-cols-2">
			<!-- col1 -->
			<button
				class="btn w-fit p-0 hover:outline hover:outline-secondary-400"
				on:click={triggerCropperModal}
			>
				<Avatar
					src="{PUBLIC_BACKEND_URL}/api/users/{data.me
						.userName}/profilePicture?reload={$reload_img}"
					fallback="https://i.pravatar.cc/?u={data.me.userName}"
					alt="profile"
				/>
			</button>
			<!-- Name  -->
			<h1 class="self-center text-4xl text-black" style:font-family="ArcadeClassic">
				{data.user.userName}
			</h1>
		</div>

		<div class="flex-1">
			<SlideToggle
				class="text-black"
				name="slider-label"
				bind:checked={twoFA}
				on:change={setup2FA}
			>
				2FA Authentication
			</SlideToggle>
		</div>

		<!--  Name + stats-->
		<div class="flex flex-1 flex-col" style:font-family="ArcadeClassic">
			<!-- Stats  -->
			<div class="flex flex-1 items-center text-black">
				<div class="flex flex-1 flex-col items-center">
					<div class="">Played</div>
					<div class="flex-1">
						<ProgressRadial font={140} width="w-24" value={100} fill="">
							{data.user.nWin + data.user.nLoose}
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
		<div class="py-8 text-center text-3xl font-bold text-gray-500">No games to show yet</div>
	{/if}
</div>
