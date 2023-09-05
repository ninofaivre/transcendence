<script lang="ts">
	import { getModalStore } from "@skeletonlabs/skeleton"
	import type { StepperState } from "@skeletonlabs/skeleton/dist/components/Stepper/types"
	import type { ModalSettings, ModalComponent, ModalStore } from "@skeletonlabs/skeleton"

	import { FileDropzone } from "@skeletonlabs/skeleton"
	import { Stepper, Step } from "@skeletonlabs/skeleton"
	import Cropper from "svelte-easy-crop"
	import { getCroppedImg } from "$lib/canvas_utils"

	let _init = true

	const modalStore = getModalStore()

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

	async function triggerCropperModal() {
		const r = await new Promise<{ step: number; state: StepperState } | undefined>(
			(resolve) => {
				const modalSettings: ModalSettings = {
					type: "component",
					component: "CropperModal",
					response: () => {
						modalStore.close()
						resolve(r)
					},
				}
				modalStore.trigger(modalSettings)
			},
		)
		if (r) {
			alert("Got cropped image !")
		}
	}

	function onComplete() {
		if ($modalStore[0].response) {
			$modalStore[0].response("coucou")
		}
	}

	_init = false
</script>

<div class="w-2/3">
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
				<svelte:fragment slot="message">Upload your profile picture</svelte:fragment>
				<svelte:fragment slot="meta">PNG and JPEG files only</svelte:fragment>
			</FileDropzone>
			<img src={img_src} alt="preview" class="w-7" />
		</Step>
		<!-- <Step locked={cropper_lock}> -->
		<Step>
			<svelte:fragment slot="header">Square it</svelte:fragment>
			<Cropper image={img_src} aspect={1} zoom={1} on:cropcomplete={reportCrop} />
		</Step>
		<Step>
			<svelte:fragment slot="header">Do you like it ?</svelte:fragment>
			<img src={cropped_image_src} alt="cropped preview" class="w-7" />
		</Step>
	</Stepper>
</div>

<!-- <footer class="modal-footer"> -->
<!-- 	<button type="button" class="variant-ghost-surface btn" on:click={onClose}>Cancel</button> -->
<!-- 	<button type="submit" class="variant-filled btn">Mute</button> -->
<!-- </footer> -->
