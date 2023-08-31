<script lang="ts">
	import type { GameSocket } from "$types"
	import type { Writable } from "svelte/store"

	import { ProgressRadial, modalStore } from "@skeletonlabs/skeleton"
	import { timeReplyToInvitation } from "contract"
	import { afterUpdate, getContext } from "svelte"
	import { goto } from "$app/navigation"

	let state: "accepted" | "refused" | "timedOut" | "waiting" | "badRequest" = "waiting"
	let value = timeReplyToInvitation
	const username = $modalStore[0].meta.username
	const game_socket: Writable<GameSocket> = $modalStore[0].meta.game_socket

	// let game_socket: Writable<GameSocket> = getContext("game_socket")
	console.log("Got game_socket from context:", game_socket)
	$game_socket.emit("invite", { username }, (res: "accepted" | "refused" | "badRequest") => {
		state = res
		if (state === "accepted") {
			if ($modalStore[0].response) {
				$modalStore[0].response(true)
			}
		}
	})

	let i = timeReplyToInvitation
	while (i--) {
		setTimeout(() => {
			value -= 1
		}, 1000 * i)
	}

	function onClose() {
		if ($modalStore[0].response) {
			$modalStore[0].response(undefined)
		}
	}

	$: {
		if (value <= 0) {
			if (state === "waiting") state = "timedOut"
		}
	}
</script>

<div class="card grid grid-rows-3 p-8">
	{#if state === "waiting"}
		<p class="">Waiting for challenge to be accepted</p>
		<div class="self-center justify-self-center">
			<ProgressRadial value={(value * 100) / timeReplyToInvitation} width="w-16">
				{value}
			</ProgressRadial>
		</div>
		<button
			on:click={onClose}
			class="btn btn-sm variant-ghost-error mt-4 h-fit w-fit self-center justify-self-center"
		>
			Cancel
		</button>
	{:else if state === "accepted"}
		<p class="">Challenge accepted!</p>
		<button
			on:click={onClose}
			class="btn btn-sm variant-ghost-error mt-4 h-fit w-fit self-center justify-self-center"
		>
			Go to game
		</button>
	{:else if state === "refused"}
		<p class="">Invitation declined</p>
		<button
			on:click={onClose}
			class="btn btn-sm variant-ghost-error mt-4 h-fit w-fit self-center justify-self-center"
		>
			Close
		</button>
	{:else if state === "timedOut"}
		<p class="">Invitation timed out</p>
		<button
			on:click={onClose}
			class="btn btn-sm variant-ghost-error mt-4 h-fit w-fit self-center justify-self-center"
		>
			Close
		</button>
	{:else if state === "badRequest"}
		<p class="">Invitation timed out</p>
		<button
			on:click={onClose}
			class="btn btn-sm variant-ghost-error mt-4 h-fit w-fit self-center justify-self-center"
		>
			Close
		</button>
	{/if}
</div>

<style>
	p,
	button {
		font-family: "Press Start 2P", "ArcadeClassic", serif;
	}
</style>
