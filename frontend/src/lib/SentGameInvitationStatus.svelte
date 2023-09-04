<script lang="ts">
	import type { GameSocket } from "$types"
	import type { Writable } from "svelte/store"

	import { ProgressRadial, getModalStore } from "@skeletonlabs/skeleton"
	import { timeReplyToInvitation } from "contract"
	import { goto } from "$app/navigation"

	export let game_socket: Writable<GameSocket>
    export let username: string

	// const modalStore = getModalStore()
	let state: "accepted" | "refused" | "timedOut" | "waiting" | "error" = "waiting"
	let error_reason: string | undefined
	let value = timeReplyToInvitation

	// let game_socket: Writable<GameSocket> = getContext("game_socket")
	console.log("Got game_socket from context:", game_socket)

	$game_socket.emit("invite", { intraUserName: username }, (res) => {
		state = res.status
        if (res.status === "error")
            error_reason = res.reason
		if (state === "accepted") {
            goto("/pong")
		}
	})

	let i = timeReplyToInvitation
	while (i--) {
		setTimeout(() => {
			value -= 1
		}, 1000 * i)
	}

    function onClose() {

    }

    let notification: HTMLElement
</script>

<div class="flex">
    <p bind:this={notification} class="flex-1">
    {#if state === "waiting"}
        <span class="flex-1">Waiting for challenge to be accepted</span>
        <div class="flex-1">
            <ProgressRadial value={(value * 100) / timeReplyToInvitation} width="w-16">
                {value}
            </ProgressRadial>
        </div>
       {:else if state === "accepted"}
            {"Invitation accepted !"}
        {:else if state === "refused"}
            {"Invitation refused"}
        {:else if state === "timedOut"}
            {"Invitation timed out"}
        {:else if state === "error"}
            {"coucout"}
        {#if error_reason === "selfInvitation"}
            {"coucout"}
        {/if}
    {/if}
            </p>
</div>

<div class="flex">
    {#if state === "waiting"}
        <p class="flex-1">Waiting for challenge to be accepted</p>
        <div class="flex-1">
            <ProgressRadial value={(value * 100) / timeReplyToInvitation} width="w-16">
                {value}
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
		font-family: "Press Start 2P", "ArcadeClassic", serif;
	}
</style>
