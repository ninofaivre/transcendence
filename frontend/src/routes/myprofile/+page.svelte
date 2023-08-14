<script lang="ts">
	import Cropper from "svelte-easy-crop"
	import { getCroppedImg } from "$lib/canvas_utils"

	let image: string | null
	let pixelCrop: {
		x: number
		y: number
		width: number
		height: number
	}
	let croppedImage: string | null
	let fileinput: HTMLInputElement

	const defaultSrc = "https://cdn1-www.dogtime.com/assets/uploads/2011/03/puppy-development.jpg"

	function onFileSelected({
		currentTarget: { files },
	}: Event & { currentTarget: EventTarget & HTMLInputElement }) {
		if (files && files[0]) {
			const imageFile = files[0]
			const reader = new FileReader()
			reader.addEventListener("load", ({ target }) => {
				if (target?.result && typeof target.result === "string") image = target.result
			})
			reader.readAsDataURL(imageFile)
		}
	}

	let profilePicture: HTMLImageElement
	let style: string

	function previewCrop(e: CustomEvent<{ pixels: typeof pixelCrop }>) {
		pixelCrop = e.detail.pixels
		const { x, y, width } = e.detail.pixels
		const scale = 200 / width
		profilePicture.style.margin = `margin: ${-y * scale}px 0 0 ${-x * scale}px;`
		profilePicture.style.width = `width: ${profilePicture.naturalWidth * scale}px;`
	}

	async function cropImage(image: string | null, pixel_crop_info: typeof pixelCrop) {
		if (image) croppedImage = await getCroppedImg(image, pixel_crop_info)
	}

	function reset() {
		croppedImage = null
		image = null
	}

	import { PUBLIC_BACKEND_URL } from "$env/static/public"
	import { client } from "$clients"
	import { FileDropzone, FileButton, toastStore } from "@skeletonlabs/skeleton"
	import { makeToast } from "$lib/global"

	let files: FileList

	async function handleSubmit(_e: SubmitEvent) {
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
</script>

<form on:submit|preventDefault={handleSubmit}>
	<FileDropzone name="pp" bind:files>
		<div slot="lead" class="text-3xl">📁</div>
		<svelte:fragment slot="message">Upload your profile picture</svelte:fragment>
		<svelte:fragment slot="meta">PNG and JPEG files only</svelte:fragment>
	</FileDropzone>
	<button type="submit" class="btn variant-ringed"> Upload </button>
</form>

{#if !image}
	<h2>Upload a picture for cropping?</h2>
	<input
		type="file"
		accept=".jpg, .jpeg, .png"
		on:change={(e) => onFileSelected(e)}
		bind:this={fileinput}
	/>
	<h2>Or... use this cute dog 🐕</h2>
	<button
		type="button"
		on:click={() => {
			image = defaultSrc
		}}>Click me!</button
	>
{:else}
	<h2>svelte-easy-crop</h2>
	<div style="position: relative; width: 100%; height: 50%;">
		<Cropper {image} aspect={1} zoom={1} crop={{ x: 0, y: 0 }} on:cropcomplete={previewCrop} />
	</div>
	<h2>Preview</h2>
	<div class="prof-pic-wrapper">
		<img
			bind:this={profilePicture}
			class="prof-pic"
			src={image}
			alt="Profile example"
			{style}
		/>
	</div>
	{#if croppedImage}
		<h2>Cropped Output</h2>
		<img src={croppedImage} alt="Cropped profile" /><br />
	{:else}
		<br /><button
			type="button"
			on:click={async () => {
				cropImage(image, pixelCrop)
			}}>Crop!</button
		>
	{/if}
	<button type="button" on:click={reset}>Start over?</button>
{/if}

<style>
	.prof-pic-wrapper {
		height: 200px;
		width: 200px;
		position: relative;
		border: solid;
		overflow: hidden;
	}

	.prof-pic {
		position: absolute;
	}
</style>
