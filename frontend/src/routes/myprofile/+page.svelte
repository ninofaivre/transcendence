<script lang="ts">
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

<!-- <img src="{PUBLIC_BACKEND_URL}/api/users/alice/profilePicture" alt="profile" /> -->
<!-- <img src="{PUBLIC_BACKEND_URL}/api/users/cha/profilePicture" alt="profile" /> -->

<style>
</style>
