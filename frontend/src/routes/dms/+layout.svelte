<script lang="ts">
	/* types */
	import type { LayoutData } from "./$types"

	/* Components */
	import CreateDiscussion from "./CreateDiscussion.svelte"
	import DiscussionList from "./DiscussionList.svelte"
	import { onMount } from "svelte"
	import { page } from "$app/stores"

	// Get our discussions
	export let data: LayoutData

	let header: HTMLElement | null
	let header_height: number

	onMount(() => {
		header = document.getElementById("shell-header")
		if (header) {
			header_height = header.offsetHeight || 0

			const resizeObserver = new ResizeObserver((entries) => {
				// We're only watching one element
				const new_height = entries.at(0)?.contentRect.height
				if (new_height && new_height !== header_height) {
					header_height = new_height
				}
			})

			resizeObserver.observe(header)
			// This callback cleans up the observer
			return () => resizeObserver.unobserve(header as HTMLElement)
		}
	})
</script>

{#if $page.data.dmList.length}
	<!--Column layout -->
	<div
		class="grid grid-cols-[auto_1fr]"
		id="col_layout"
		style="height: calc(100vh - {header_height}px);"
	>
		<!-- Rows for Column 1-->
		<div
			class="grid grid-rows-[auto_1fr]"
			id="col1"
			style="height: calc(100vh - {header_height}px);"
		>
			<section class="p-4">
				<CreateDiscussion friendList={data.friendList} />
			</section>
			<section id="discussions" class="overflow-y-auto">
				<DiscussionList
					discussions={$page.data.dmList}
					currentDiscussionId={$page.params.id}
				/>
			</section>
		</div>

		<!-- Rows for Column 2-->
		<slot />
	</div>
{:else}
	<div id="convo" class="my-10 flex h-full flex-col justify-center">
		<div class="mx-auto text-center text-3xl font-bold">You don't have any friends yet</div>
		<div class="mx-auto my-10">Thingie form to make forms</div>
	</div>
{/if}

<style>
	#discussions {
		scrollbar-gutter: stable; /* This doesn't seem to do anything */
		scrollbar-width: thin;
	}
</style>
