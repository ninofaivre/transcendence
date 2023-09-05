<script lang="ts">
	import type { StepperState } from "@skeletonlabs/skeleton/dist/components/Stepper/types"
	import type { PaginationSettings } from "@skeletonlabs/skeleton"
	import type { MatchHistory } from "$types"
	import type { PageData } from "./$types"
	import type { TableSource } from "@skeletonlabs/skeleton"
	import type { ModalSettings, ModalComponent, ModalStore } from "@skeletonlabs/skeleton"

	import { Modal, getModalStore } from "@skeletonlabs/skeleton"
	import {
		Avatar,
		FileDropzone,
		Paginator,
		SlideToggle,
		Table,
		getToastStore,
	} from "@skeletonlabs/skeleton"
	import { client } from "$clients"
	import { checkError, makeToast } from "$lib/global"
	import { Stepper, Step } from "@skeletonlabs/skeleton"
	import Toggle from "$lib/Toggle.svelte"
	import { listenOutsideClick } from "$lib/global"
	import Cropper from "svelte-easy-crop"
	import { getCroppedImg } from "$lib/canvas_utils"
	import { isContractError } from "contract"
	import { tableMapperValues } from "@skeletonlabs/skeleton"
	import { PUBLIC_BACKEND_URL, PUBLIC_PROFILE_PICTURE_MAX_SIZE_MB } from "$env/static/public"
	import SendFriendRequestModal from "$lib/SendFriendRequestModal.svelte"

	import { page } from "$app/stores"
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
					// alert("After this one, no more data")
					keep_loading = false
				}
				match_history = [...match_history, ...remap(ret.body)]
			}
		}
	}

	// PP Upload
	let files: FileList
	$: files, console.log(files)
	let cropped_image_src: string | null = null
	let cropped_image_file: File
	let img_src: string | "" = ""
	let buttonBackLabel = "← Back"
	let buttonNextLabel = "Next →"
	let crop: {
		x: number
		y: number
		width: number
		height: number
	} = {
		x: 0,
		y: 0,
		width: 0,
		height: 0,
	}
	let picker_lock = true

	function onFileSelected() {
		if (files && files[0]) {
			const imageFile = files[0]
			const reader = new FileReader()
			reader.addEventListener("load", ({ target }) => {
				if (target?.result && typeof target.result === "string") img_src = target.result
			})
			reader.readAsDataURL(imageFile)
			picker_lock = false
		}
	}

	function reportCrop(e: CustomEvent<{ pixels: typeof crop }>) {
		crop = e.detail.pixels
	}

	function onStepHandler(e: {
		detail: { state: { current: number; total: number }; step: number }
	}) {
		// Doesn't work
		if (e.detail.state.current == 0) {
			buttonNextLabel = "Edit →"
		}
		if (e.detail.state.current == 1) {
			buttonNextLabel = "Crop"
		}
	}

	function onBackHandler() {}

	async function onNextHandler(e: {
		detail: { state: { current: number; total: number }; step: number }
	}) {
		console.log(e.detail.step)
		console.log(e.detail.state.current)
		// File picking
		if (e.detail.state.current == 0) {
		}
		// Just cropped
		if (e.detail.state.current == 2) {
			const cropped_image_blob = await getCroppedImg(img_src, crop)
			cropped_image_src = URL.createObjectURL(cropped_image_blob)
			cropped_image_file = new File([cropped_image_blob], cropped_image_src, {
				type: files[0].type,
			})
		}
	}

	async function onComplete(e: CustomEvent<{ step: number; state: StepperState }>) {
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

	_init = false
</script>

<div class="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
	<div class="flex flex-col gap-2 rounded-lg bg-gray-50 p-8 sm:px-10">
		<!-- Avatar -->
		<div class="grid flex-1 grid-cols-2">
			<!-- col1 -->
			<Avatar
				src="{PUBLIC_BACKEND_URL}/api/users/{data.me
					.userName}/profilePicture?reload={$reload_img}"
				fallback="https://i.pravatar.cc/?u={data.me.userName}"
				alt="profile"
			/>
			<!-- col2 -->
			<h1 class="self-center text-black">{data.me.userName}</h1>
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

<Toggle let:toggle>
	<svelte:fragment let:toggle slot="active">
		<div use:listenOutsideClick on:outsideclick={toggle}>
			<Stepper
				on:next={onNextHandler}
				on:step={onStepHandler}
				on:back={onBackHandler}
				on:complete={onComplete}
				buttonCompleteLabel="Upload"
				{buttonBackLabel}
				{buttonNextLabel}
			>
				<Step locked={picker_lock}>
					<svelte:fragment slot="header">Choose a new profile picture</svelte:fragment>
					<FileDropzone
						bind:files
						name="pp"
						accept=".jpg, .jpeg, .png"
						on:change={onFileSelected}
					>
						<div slot="lead" class="text-3xl">📁</div>
						<svelte:fragment slot="message">Upload your profile picture</svelte:fragment
						>
						<svelte:fragment slot="meta">PNG and JPEG files only</svelte:fragment>
					</FileDropzone>
					<img src={img_src} alt="preview" />
				</Step>
				<!-- <Step locked={cropper_lock}> -->
				<Step>
					<svelte:fragment slot="header">Square it</svelte:fragment>
					<Cropper image={img_src} aspect={1} zoom={1} on:cropcomplete={reportCrop} />
				</Step>
				<Step>
					<svelte:fragment slot="header">Do you like it ?</svelte:fragment>
					<img src={cropped_image_src} alt="cropped preview" />
				</Step>
			</Stepper>
		</div>
	</svelte:fragment>
	<button class="variant-filled btn btn-sm" on:click={toggle}>Change profile picture</button>
</Toggle>
