<script lang="ts">
	import type { GameSocket } from "$types"
	import type { Writable } from "svelte/store"

	import { ProgressRadial, getModalStore } from "@skeletonlabs/skeleton"
	import { timeReplyToInvitation } from "contract"
	import { goto } from "$app/navigation"

	const modalStore = getModalStore()
	let state: "accepted" | "refused" | "timedOut" | "waiting" | "error" = "waiting"
	let error_reason: string | undefined
	const username: string = $modalStore[0].meta.username
	const game_socket: Writable<GameSocket> = $modalStore[0].meta.game_socket

	// let game_socket: Writable<GameSocket> = getContext("game_socket")
	console.log("Got game_socket from context:", game_socket)

	$game_socket.emit("invite", { intraUserName: username }, (res) => {
		state = res.status
		if (res.status === "error") {
			error_reason = res.reason
			setTimeout(() => {
				if ($modalStore[0]?.response) {
					$modalStore[0].response(undefined)
				}
			}, 1000)
		}
		if (state === "accepted") {
			goto("/pong")
		}
	})

	let value = timeReplyToInvitation
	for (let i = timeReplyToInvitation / 1000; i > 0; i--) {
		setTimeout(() => {
			value -= 1000
		}, 1000 * i)
	}

	function onClose() {
		if ($modalStore[0]?.response) {
			$modalStore[0].response(undefined)
		}
	}
</script>

<div class="card grid grid-rows-3 p-8">
	{#if state === "waiting"}
		<p class="">Waiting for challenge to be accepted</p>
		<div class="self-center justify-self-center">
			<ProgressRadial value={(value * 100) / timeReplyToInvitation} width="w-16">
				{value / 1000}
			</ProgressRadial>
		</div>
	{:else if state === "accepted"}
		<p class="">Challenge accepted!</p>
		<button
			on:click={onClose}
			class="variant-ghost-error btn btn-sm mt-4 h-fit w-fit self-center justify-self-center"
		>
			Go to game
		</button>
	{:else if state === "refused"}
		<p class="">Invitation declined</p>
		<button
			on:click={onClose}
			class="variant-ghost-error btn btn-sm mt-4 h-fit w-fit self-center justify-self-center"
		>
			Close
		</button>
	{:else if state === "timedOut"}
		<p class="">Invitation timed out</p>
		<button
			on:click={onClose}
			class="variant-ghost-error btn btn-sm mt-4 h-fit w-fit self-center justify-self-center"
		>
			Close
		</button>
	{:else if state === "error"}
		<p class="text-center">Impossible</p>
		{#if error_reason === "selfInvitation"}
			<p class="">You can't invite yourself!</p>
		{:else if error_reason === "invitingNotAvailable"}
			<p class="">You are already in game!</p>
		{/if}
		<button
			on:click={onClose}
			class="variant-ghost-error btn btn-sm mt-4 h-fit w-fit self-center justify-self-center"
		>
			Close
		</button>
	{/if}
</div>

<style>
	p,
	button {
		font-family: "ArcadeClassic", monospace;
	}
</style>
