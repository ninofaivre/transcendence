<script lang="ts">
	import type { StepperState } from "@skeletonlabs/skeleton/dist/components/Stepper/types"

	import { FileDropzone } from "@skeletonlabs/skeleton"
	import { client } from "$clients"
	import { makeToast } from "$lib/global"
	import { Stepper, Step } from "@skeletonlabs/skeleton"
	import Toggle from "$lib/Toggle.svelte"
	import { listenOutsideClick } from "$lib/global"
	import Cropper from "svelte-easy-crop"
	import { getCroppedImg } from "$lib/canvas_utils"
	import { isContractError } from "contract"

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
			makeToast("Upload successful")
		} else if (isContractError(ret)) {
			makeToast(`Upload failed: ${ret.body.message}`)
		} else
			throw new Error(
				`Coulnd't upload profile picture. Unexpected return from the server: ${ret.status}`,
			)
	}

	let picker_lock = true
	let cropper_lock = true
</script>

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
	<button class="btn btn-sm variant-filled" on:click={toggle}>Change profile picture</button>
</Toggle>
