<script lang="ts">
	import { FileDropzone, FileButton } from "@skeletonlabs/skeleton"

	let files: FileList

	function handleSubmit(e: SubmitEvent) {}
</script>

<form on:submit|preventDefault={handleSubmit}>
	<FileDropzone name="pp">
		<div slot="lead" class="text-3xl">📁</div>
		<svelte:fragment slot="message">Upload your profile picture</svelte:fragment>
		<svelte:fragment slot="meta">PNG and JPEG files only</svelte:fragment>
	</FileDropzone>
</form>

<style>
</style>
