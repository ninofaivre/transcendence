<script lang="ts">
	/* types */
	import type { LayoutData } from "./$types"

	/* Components */
	import ChanList from "./ChanList.svelte"
	import { onMount } from "svelte"
	import { page } from "$app/stores"
	import SendFriendRequest from "$lib/SendFriendRequest.svelte"
	import { addListenerToEventSource } from "$lib/global"
	import { sse_store } from "$stores"
	import { invalidate } from "$app/navigation"
	import { getModalStore, getToastStore, type ModalSettings } from "@skeletonlabs/skeleton"
	import { checkError } from "$lib/global"
	import { client } from "$clients"
	import { makeToast } from "$lib/global"

	// Get our discussions
	// export let data: LayoutData // TODO wtf

	const modalStore = getModalStore()
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
			addListenerToEventSource($sse_store!, "KICKED_FROM_CHAN", (data) => {
				if (data.chanId === $page.params.chanId) {
					invalidate(":chans")
				}
			}),
		)
		return () => {
			if (header) resizeObserver.unobserve(header as HTMLElement)
			destroyer.forEach((func) => void func())
		}
	})

	async function onCreateChan() {
		type ModalReturnType =
			| { type: "PRIVATE" | "PUBLIC"; title: string; password: string | undefined }
			| undefined
		const r = await new Promise<ModalReturnType>((resolve) => {
			const modal: ModalSettings = {
				type: "component",
				component: "CreateRoom",
				response: (r) => {
					modalStore.close()
					resolve(r)
				},
			}
			modalStore.trigger(modal)
		})
		if (r) {
			const { type, title, password } = r
			const ret = await client.chans.createChan({
				body: {
					type,
					title,
					password,
				},
			})
			if (ret.status != 201) checkError(ret, "create a new room")
			else {
				makeToast(`Created a new ${type.toLowerCase()} room: ${r}`, getToastStore())
				invalidate(":chans")
			}
		}
	}

	async function onJoinChan() {
		type ModalReturnType = { chan: string; password: string | undefined } | undefined
		const r = await new Promise<ModalReturnType>((resolve) => {
			const modal: ModalSettings = {
				type: "component",
				component: "JoinRoom",
				response: (r) => {
					modalStore.close()
					resolve(r)
				},
			}
			modalStore.trigger(modal)
		})
		if (r) {
			alert(r.chan + " | " + r.password)
			// 	const { chanName, password } = r
			// 	const ret = await client.chans.createChan({
			// 		body: {
			// 			type,
			// 			title,
			// 			password,
			// 		},
			// 	})
			// 	if (ret.status != 201) checkError(ret, "create a new room")
			// 	else {
			// 		makeToast(`Created a new ${type.toLowerCase()} room: ${r}`, getToastStore())
			// 		invalidate(":chans")
			// 	}
		}
	}
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
			class="grid grid-rows-[auto_1fr] gap-1"
			id="col1"
			style="height: calc(100vh - {header_height}px);"
		>
			<section class="mt-1 grid gap-1">
				<button
					class="variant-ghost-primary btn btn-sm w-full rounded"
					on:click={onJoinChan}
				>
					Join a room
				</button>
				<button
					class="variant-ghost-primary btn btn-sm w-full rounded"
					on:click={onCreateChan}
				>
					Create new room
				</button>
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
			<button class="variant-filled btn btn-sm" on:click={onCreateChan}>
				Create new Room
			</button>
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
