<script lang="ts">
	import { FileDropzone, FileButton } from "@skeletonlabs/skeleton"
</script>

<FileDropzone name="pp">
	<div slot="lead" class="text-3xl">📁</div>
	<svelte:fragment slot="message">Upload your profile picture</svelte:fragment>
	<svelte:fragment slot="meta">PNG and JPEG files only</svelte:fragment>
</FileDropzone>

<style>
</style>
