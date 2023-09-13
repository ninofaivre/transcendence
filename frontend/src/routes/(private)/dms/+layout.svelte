<script lang="ts">
	/* types */
	import type { LayoutData } from "./$types"

	/* Components */
	import DiscussionList from "./DiscussionList.svelte"
	import { getContext, onMount } from "svelte"
	import { page } from "$app/stores"
	import { addListenerToEventSource } from "$lib/global"
	import { getModalStore, type ModalSettings } from "@skeletonlabs/skeleton"
	import { client } from "$clients"
	import { invalidate } from "$app/navigation"
	import type { Writable } from "svelte/store"

	// Get our discussions
	export let data: LayoutData
	const sse_store: Writable<EventSource> = getContext("sse_store")

	const modalStore = getModalStore()
	const makeToast: (message: string) => void = (window as any).makeToast
	const checkError: (ret: { status: number; body: any }, what: string) => void = (window as any)
		.checkError
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
			addListenerToEventSource($sse_store, "CREATED_DM", (new_data) => {
				data.dmList = [new_data, ...data.dmList]
			}),
		)
		return () => {
			if (header) resizeObserver.unobserve(header as HTMLElement)
			destroyer.forEach((func) => void func())
		}
	})

	async function onSendFriendRequest() {
		const username = await new Promise<string | undefined>((resolve) => {
			const modal: ModalSettings = {
				type: "component",
				component: "SendFriendRequestModal",
				response: (r) => {
					modalStore.close()
					resolve(r)
				},
			}
			modalStore.trigger(modal)
		})
		if (username) {
			const ret = await client.invitations.friend.createFriendInvitation({
				body: { invitedUserName: username },
			})
			if (ret.status != 201) {
				checkError(ret, "create friend request")
			} else {
				invalidate("app:friendships")
				makeToast("Friend request sent")
			}
		}
	}
</script>

{#if data.dmList.length}
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
			<section class="mt-2">
				<button
					class="variant-ghost-primary btn btn-sm mt-1 rounded"
					on:click={onSendFriendRequest}
				>
					Send friend request
				</button>
			</section>
			<section id="discussions" class="overflow-y-auto">
				<DiscussionList discussions={data.dmList} currentDiscussionId={$page.params.dmId} />
			</section>
		</div>

		<!-- Rows for Column 2-->
		<slot />
	</div>
{:else}
	<div id="convo" class="my-10 flex h-full flex-col justify-center">
		<div class="mx-auto text-center text-3xl font-bold">You don't have any friends yet</div>
		<div class="mx-auto my-10">
			<button
				class="variant-ghost-tertiary btn btn-sm w-full rounded-md text-2xl"
				style:font-family="ArcadeClassic"
				on:click={onSendFriendRequest}
			>
				Send a friend request
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
