<script lang="ts">
	/* types */
	import type { LayoutData } from "./$types"

	/* Components */
	import ChanList from "./ChanList.svelte"
	import { onMount } from "svelte"
	import { page } from "$app/stores"
	import SendFriendRequest from "$lib/SendFriendRequest.svelte"
	import { listenOutsideClick } from "$lib/global"
	import CreateDiscussion from "$lib/CreateDiscussion.svelte"
	import { addListenerToEventSource } from "$lib/global"
	import { sse_store } from "$stores"

	// Get our discussions
	// export let data: LayoutData // TODO wtf

	let header: HTMLElement | null
	let header_height: number

	onMount(() => {
		header = document.getElementById("shell-header")
		let resizeObserver: ResizeObserver
		if (header) {
			header_height = header.offsetHeight || 0

			resizeObserver = new ResizeObserver((entries) => {
				// We're only watching one element
				const new_height = entries.at(0)?.contentRect.height
				if (new_height && new_height !== header_height) {
					header_height = new_height
				}
			})

			resizeObserver.observe(header)
			// This callback cleans up the observer
		}
		const destroyer: (() => void)[] = new Array(
			addListenerToEventSource($sse_store!, "UPDATED_CHAN_USER", (data) => {
				console.log("layout received event about chan users field update")
			}),
		)
		return () => {
			if (header) resizeObserver.unobserve(header as HTMLElement)
			destroyer.forEach((func) => void func())
		}
	})

	let creating_channel = false
</script>

{#if $page.data.chanList.length}
	<!--Column layout -->
	<div
		class="grid grid-cols-[auto_1fr]"
		id="col_layout"
		style="height: calc(100vh - {header_height}px);"
	>
		<!-- Rows for Column 1-->
		<div
			class="grid grid-rows-[auto_1fr] gap-3"
			id="col1"
			style="height: calc(100vh - {header_height}px);"
		>
			<section
				class="mt-2"
				use:listenOutsideClick
				on:outsideclick={() => (creating_channel = false)}
			>
				{#if creating_channel}
					<CreateDiscussion
						friendList={$page.data.friendList}
						on:submit={() => (creating_channel = false)}
					/>
				{:else}
					<button
						class="btn btn-sm variant-filled-tertiary mt-1 rounded-md text-xs"
						on:click={() => (creating_channel = true)}
					>
						+
					</button>
				{/if}
			</section>
			<section id="discussions" class="overflow-y-auto">
				<ChanList
					discussions={$page.data.chanList}
					currentDiscussionId={$page.params.chanId}
				/>
			</section>
		</div>

		<!-- Rows for Column 2-->
		<slot />
	</div>
{:else}
	<div class="my-2 flex h-full flex-col justify-center">
		<div class="text-center text-xl font-bold">
			You are not participating in any channel yet
		</div>
		<div class="mx-auto my-10">
			<h2 class="my-2">Invite a friend:</h2>
			<SendFriendRequest />
			<h2 class="my-2">Create a new Discussion:</h2>
			<CreateDiscussion friendList={$page.data.friendList} />
		</div>
	</div>
{/if}

<style>
	#discussions {
		scrollbar-gutter: stable; /* This doesn't seem to do anything */
		scrollbar-width: thin;
	}

	#col1 {
		margin: 0px 3px;
	}
</style>
