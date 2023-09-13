<script lang="ts">
	import type { Chan } from "$types"
	import { getContext, onMount } from "svelte"
	import { addListenerToEventSource } from "$lib/global"
	import { goto, invalidate } from "$app/navigation"
	import { getModalStore, type ModalSettings } from "@skeletonlabs/skeleton"
	import { client } from "$clients"
	import type { Writable } from "svelte/store"

	const modalStore = getModalStore()
	const sse_store: Writable<EventSource> = getContext("sse_store")
	const checkError: (ret: { status: number; body: any }, what: string) => void = (window as any)
		.checkError
	const makeToast: (message: string) => void = (window as any).makeToast

	export let currentDiscussionId: string
	export let discussions: Chan[]

	onMount(() => {
		const destroyer = new Array(
			// addListenerToEventSource($sse_store, "CREATED_CHAN_ELEMENT", (new_data) => {
			// 	console.log("CREATED_CHAN_ELEMENT")
				// invalidate("app:chans")
				// TODO: mark chan unread on new message ?
			// }),
			// addListenerToEventSource($sse_store, "UPDATED_CHAN_MESSAGE", (new_data) => {
			// 	console.log("UPDATED_CHAN_MESSAGE")
			// 	// invalidate("app:chans")
			// 	// TODO: mark chan unread on new message ?
			// }),
		)
		return () => {
			destroyer.forEach((func: () => void) => func())
		}
	})

	async function onInviteToChan(chanId: string) {
		const r = await new Promise<string | undefined>((resolve) => {
			const modal: ModalSettings = {
				type: "component",
				component: "InviteFriendToChanModal",
				response: (r) => {
					modalStore.close()
					resolve(r)
				},
				meta: { chanId },
			}
			modalStore.trigger(modal)
		})
		if (r) {
			const ret = await client.invitations.chan.createChanInvitation({
				body: {
					chanId,
					invitedUserName: r,
				},
			})
			if (ret.status != 201) checkError(ret, `invite ${r} to this channel`)
			else {
				makeToast(`Invited ${r} to this channel`)
				invalidate("app:chans:invitations") // Does this work ? TODO
			}
		}
	}

	async function changePasswordModal(d: Chan) {
		const password = await new Promise<string | null | undefined>((resolve) => {
			const modalSettings: ModalSettings = {
				type: "component",
				component: "ChangePasswordModal",
				response: (r) => {
					modalStore.close(), resolve(r)
				},
				meta: { chanId: d.id },
			}
			modalStore.trigger(modalSettings)
		})
		if (password !== undefined) {
			const ret = await client.chans.updateChan({
				params: {
					chanId: d.id,
				},
				body: {
					type: "PUBLIC",
					password,
				},
			})
			if (ret.status !== 204) {
				if (password) checkError(ret, "change password")
				else checkError(ret, "remove password")
			} else {
				if (password) makeToast("Changed password on " + d.title)
				else makeToast("Removed password on" + d.title)
                invalidate("app:chans")
			}
		}
	}

	async function leaveChan(d: Chan) {
		const ret = await client.chans.leaveChan({
			params: {
				chanId: d.id,
			},
			body: null,
		})
		if (ret.status !== 204) checkError(ret, "remove chan: " + d.title)
		else {
			goto("/chans", { invalidateAll: true })
			// goto("/chans")
		}
	}

	async function removeChan(d: Chan) {
		const ret = await client.chans.deleteChan({
			params: {
				chanId: d.id,
			},
			body: null,
		})
		if (ret.status !== 204) checkError(ret, "remove chan: " + d.title)
		else {
			goto("/chans", { invalidateAll: true })
			// goto("/chans")
		}
	}
</script>

{#each discussions as d}
    {@const canEdit = d.selfPerms.includes("EDIT")}
    {@const canDestroy = d.selfPerms.includes("DESTROY")}
	<div
		class={`flex place-items-center rounded px-1 py-2 ${
			d.id != currentDiscussionId
				? "font-medium hover:variant-soft-secondary hover:font-semibold"
				: "variant-ghost-secondary font-semibold"
		}`}
	>
		<a href={`/chans/${d.id}`} class="mx-2 flex-1 justify-self-start">
			{d.id.slice(0, 8)}
			{d.title}
		</a>
		{#if d.passwordProtected}
			<button
				class={ canEdit ? "variant-ghost-secondary btn btn-sm mx-[0.10rem] p-1" : "variant-glass-surface !cursor-default mx-[0.10rem] p-1"}
				on:click={() => {
					if (canEdit) changePasswordModal(d)
				}}
			>
				🔒
			</button>
		{:else}
			<button
				class={ canEdit ? "variant-ghost-secondary btn btn-sm mx-[0.10rem] p-1" : "variant-glass-surface-secondary !cursor-default mx-[0.10rem] p-1"}
				on:click={() => {
					if (canEdit) changePasswordModal(d)
				}}
			>
				🔓 
			</button>
		{/if}
		<button
			on:click={() => onInviteToChan(d.id)}
			class="variant-ghost-secondary btn btn-sm mx-[0.10rem] p-1"
		>
			👥+
		</button>
		{#if d.selfPerms.includes("DESTROY")}
			<button
				class="variant-ghost-secondary btn btn-sm mx-[0.10rem] p-1"
				on:click={() => {
					removeChan(d)
				}}
			>
				❌
			</button>
		{:else}
			<button
				class="variant-ghost-secondary btn btn-sm mx-[0.10rem] p-1"
				on:click={() => {
					leaveChan(d)
				}}
			>
				🚪
			</button>
		{/if}
	</div>
{/each}

<style>
	a {
		display: block;
	}
	/* a::first-letter { */
	/* 	text-transform: capitalize; */
	/* } */

	button {
		visibility: hidden;
	}

	div:hover > button {
		visibility: visible;
	}

	button:hover {
		font-weight: 700;
		cursor: pointer;
	}
</style>
