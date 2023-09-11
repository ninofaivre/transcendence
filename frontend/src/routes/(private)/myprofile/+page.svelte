<script lang="ts">
	import type { PaginationSettings } from "@skeletonlabs/skeleton"
	import type { MatchHistory } from "$types"
	import type { PageData } from "./$types"
	import type { TableSource } from "@skeletonlabs/skeleton"
	import type { ModalSettings } from "@skeletonlabs/skeleton"

	import { ProgressRadial, getModalStore } from "@skeletonlabs/skeleton"
	import { Avatar, Paginator, SlideToggle, Table, getToastStore } from "@skeletonlabs/skeleton"
	import { client } from "$clients"
	import { isContractError } from "contract"
	import { tableMapperValues } from "@skeletonlabs/skeleton"
	import { PUBLIC_BACKEND_URL, PUBLIC_PROFILE_PICTURE_MAX_SIZE_MB } from "$env/static/public"

	import { reload_img } from "$stores"
	import { invalidate } from "$app/navigation"
	import { tick } from "svelte"

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
					checkError(ret, `${twoFA ? "enable" : "disable"} 2FA`)
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
			const ret = await client.game.getMatchHistory({
				params: { username: data.me.userName },
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
			makeToast("Upload successful")
			$reload_img = $reload_img + 1
		} else if (ret.status === 413) {
			makeToast(
				`Image is too big. Upload must be under ${PUBLIC_PROFILE_PICTURE_MAX_SIZE_MB}MB`,
			)
		} else if (isContractError(ret)) {
			makeToast(`Upload failed: ${ret.body.message}`)
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

	async function changeDisplayName() {
		const r = await new Promise<string | undefined>((resolve) => {
			const modalSettings: ModalSettings = {
				type: "component",
				component: "UsernameChooserModal",
				response: (r) => {
					modalStore.close()
					resolve(r)
				},
			}
			modalStore.trigger(modalSettings)
		})
		if (r) {
			const ret = await client.users.updateMe({
				body: {
					displayName: r,
				},
			})
			if (ret.status !== 200) {
				checkError(ret, "change username")
			} else {
				makeToast(`Your new username is ${ret.body.displayName}`)
				invalidate(":me")
			}
		}
	}

	function makeToast(message: string) {
		if (toastStore)
			toastStore.trigger({
				message,
			})
	}
	function checkError(ret: { status: number; body: any }, what: string) {
		if (isContractError(ret)) {
			makeToast("Could not " + what + " : " + ret.body.message)
			console.log(ret.body.code)
		} else {
			let msg = "Server return unexpected status " + ret.status
			if ("message" in ret.body) msg += " with message " + ret.body.message
			makeToast(msg)
			console.error(msg)
		}
	}

	_init = false

	let display_name_content: string = data.me.displayName
	let name_already_exists: boolean = false
	export function makeEditable(node: HTMLElement) {
		let original_display_name: string = node.textContent as string

		const makeEditable = () => {
			node.contentEditable = "true"
			node.focus()
		}
		const reset = async () => {
			console.log("blur!")
			node.contentEditable = "false"
			node.textContent = original_display_name
		}
		const checkIfExistsSubmitOnEnter = async (e: Event) => {
			const ev = e as InputEvent
			const enter_pressed = ["insertParagraph", "insertLineBreak"].includes(ev.inputType)
			if (enter_pressed) {
				console.log(ev.inputType)
				ev.preventDefault()
				ev.stopPropagation()
			}
			if (display_name_content) {
				const ret = await client.users.searchUsersV2({
					query: {
						params: {},
						action: "*",
						displayNameContains: display_name_content,
					},
				})
				if (ret.status !== 200) {
					checkError(ret, "get room list")
				} else {
					let userlist = ret.body.map((obj) => obj.displayName)
					name_already_exists = userlist.includes(display_name_content)
				}
			}
			if (enter_pressed) removeEditableAndSubmit()
		}
		const removeEditableAndSubmit = async () => {
			node.contentEditable = "false"
			if (!display_name_content || name_already_exists) {
				alert(display_name_content)
				node.textContent = original_display_name
			} else {
				const ret = await client.users.updateMe({
					body: {
						displayName: display_name_content,
					},
				})
				if (ret.status !== 200) {
					checkError(ret, "change your username")
				} else {
					original_display_name = display_name_content
					makeToast("Username successfully changed")
				}
			}
		}
		node.addEventListener("click", makeEditable)
		node.addEventListener("beforeinput", checkIfExistsSubmitOnEnter)
		node.addEventListener("blur", reset)
		return {
			destroy: () => {
				node.removeEventListener("blur", reset)
				node.removeEventListener("beforeinput", checkIfExistsSubmitOnEnter)
				node.removeEventListener("click", makeEditable)
			},
		}
	}
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
			<div>
				<h1
					class="self-center bg-teal-400 text-4xl text-black"
					style:font-family="ArcadeClassic"
					contenteditable="false"
					bind:textContent={display_name_content}
					use:makeEditable
				/>
				{#if name_already_exists}
					<sub class="text-red-600"> This name is already taken </sub>
				{:else}
					<sub class="text-green-500">Available</sub>
				{/if}
			</div>
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
