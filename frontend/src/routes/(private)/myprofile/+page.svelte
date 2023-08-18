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

	let files: FileList
	let image: string | null
	let img_src =
		"https://media.istockphoto.com/id/1188445864/photo/closeup-portrait-of-funny-ginger-cat-wearing-sunglasses-isolated-on-light-cyan-copyspace.jpg?s=612x612&w=0&k=20&c=LHy_WCxNUEdejVx2sKK3Hq_dAQ_yyNRxspDxiDLUymg="

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

	function onStepHandler(e: {
		detail: { state: { current: number; total: number }; step: number }
	}) {}

	async function handleSubmit(e: CustomEvent<{ step: number; state: StepperState }>) {
		const { status } = await client.users.setMyProfilePicture({
			body: {
				profilePicture: files[0],
			},
		})
		if (status === 204) {
			makeToast("Upload successful")
		} else {
			makeToast(`Upload failed with status ${status}`)
		}
	}
	function onBackHandler() {}
	function onNextHandler(e: {
		detail: { state: { current: number; total: number }; step: number }
	}) {
		console.log(e.detail)
	}

	function previewCrop() {
		cropper_lock = false
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
				on:complete={handleSubmit}
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
				<Step locked={cropper_lock}>
					<svelte:fragment slot="header">Square it</svelte:fragment>
					<Cropper
						image={img_src}
						aspect={1}
						zoom={1}
						crop={{ x: 0, y: 0 }}
						on:cropcomplete={previewCrop}
					/>
				</Step>
				<Step>
					<svelte:fragment slot="header">Do you like it ?</svelte:fragment>
					<img src={img_src} alt="preview" />
				</Step>
			</Stepper>
		</div>
	</svelte:fragment>
	<button class="btn btn-sm variant-filled" on:click={toggle}>Change profile picture</button>
</Toggle>
