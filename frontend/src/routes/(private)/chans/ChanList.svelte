<script lang="ts">
	import type { Chan } from "$types"
	import { getContext, onMount } from "svelte"
	import { addListenerToEventSource } from "$lib/global"
	import { invalidate } from "$app/navigation"
	import { getModalStore, getToastStore, type ModalSettings } from "@skeletonlabs/skeleton"
	import { client } from "$clients"
	import type { Writable } from "svelte/store"
	import { isContractError } from "contract"

	const modalStore = getModalStore()
	const sse_store: Writable<EventSource> = getContext("sse_store")
	const toastStore = getToastStore()

	export let currentDiscussionId: string
	export let discussions: Chan[]

	onMount(() => {
		const destroyer = new Array(
			addListenerToEventSource($sse_store, "CREATED_CHAN_ELEMENT", (new_data) => {
				invalidate(":chans") // Does this work ?
				// TODO: mark chan unread on new message ?
			}),
			addListenerToEventSource($sse_store, "UPDATED_CHAN_MESSAGE", (new_data) => {
				invalidate(":chans") // Does this work ?
				// TODO: mark chan unread on new message ?
			}),
		)
		return () => {
			destroyer.forEach((func: () => void) => func())
		}
	})

	async function onInviteToChan(chanId: string) {
		const r = await new Promise<string | undefined>((resolve) => {
			const modal: ModalSettings = {
				type: "component",
				component: "InviteFriendToChan",
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
				invalidate(":chans:invitations") // Does this work ? TODO
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
		else invalidate(":chans")
	}

	async function removeChan(d: Chan) {
		const ret = await client.chans.deleteChan({
			params: {
				chanId: d.id,
			},
			body: null,
		})
		if (ret.status !== 204) checkError(ret, "remove chan: " + d.title)
		else invalidate(":chans")
	}

	function makeToast(message: string) {
		if (toastStore)
			toastStore.trigger({
				message,
			})
	}
	function checkError(ret: { status: number; body: any }, what: string) {
		if (isContractError(ret)) {
			makeToast("Could not " + what + " : " + ret.body.message)
			console.log(ret.body.code)
		} else {
			let msg = "Server return unexpected status " + ret.status
			if ("message" in ret.body) msg += " with message " + ret.body.message
			makeToast(msg)
			console.error(msg)
		}
	}
</script>

{#each discussions as d}
	<div
		class={`flex place-items-center rounded px-1 py-2 ${
			d.id != currentDiscussionId
				? "font-medium hover:variant-soft-secondary hover:font-semibold"
				: "variant-ghost-secondary font-semibold"
		}`}
	>
		<a href={`/chans/${d.id}`} class="mx-2 flex-1 justify-self-start">
			{d.title}
		</a>
		{#if d.passwordProtected}
			<button
				class="variant-ghost-secondary btn btn-sm mx-[0.10rem] p-1"
				on:click={() => {
					if (d.selfPerms.includes("EDIT")) changePasswordModal(d)
				}}
			>
				🔒
			</button>
		{:else}
			<button
				class="variant-ghost-secondary btn btn-sm mx-[0.10rem] p-1"
				on:click={() => {
					if (d.selfPerms.includes("EDIT")) changePasswordModal(d)
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
		<button
			class="variant-ghost-secondary btn btn-sm mx-[0.10rem] p-1"
			on:click={() => {
				if (d.selfPerms.includes("EDIT")) removeChan(d)
                else leaveChan(d)
			}}
		>
			X
		</button>
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
