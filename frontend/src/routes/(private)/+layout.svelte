<script lang="ts">
	import type { GameSocket } from "$types"
	import type { ModalSettings } from "@skeletonlabs/skeleton"
	import type { Writable } from "svelte/store"

	import { PUBLIC_BACKEND_URL } from "$env/static/public"
	import { io } from "socket.io-client"
	import { onDestroy, setContext } from "svelte"
	import { getModalStore } from "@skeletonlabs/skeleton"
	import { writable } from "svelte/store"
	import { goto } from "$app/navigation"

	console.log("private layout init")
	const modalStore = getModalStore()

	const banner = {
        message: "",
        pending: false
    }
	let banner_store = writable(banner)
	setContext("banner_store", banner_store)

	// Sse
	let sse_store: Writable<EventSource> = writable(
		new EventSource(PUBLIC_BACKEND_URL + "/api/sse", { withCredentials: true }),
	)
	$sse_store.onopen = function (_evt) {
		console.log("Successfully established sse connection")
	}
	$sse_store.onerror = function (_evt) {
		console.log("Error while openning new sse connection: Probably already in use")
	}
	setContext("sse_store", sse_store)

	// Game socket
	let game_socket: Writable<GameSocket> = writable(
		io(PUBLIC_BACKEND_URL, {
			withCredentials: true,
		}),
	)
	applyCallbacks()
	function applyCallbacks() {
		$game_socket.on("disconnect", (data) => {
			console.log(data)
			if (data === "io server disconnect") {
				$game_socket = io(PUBLIC_BACKEND_URL, {
					withCredentials: true,
				})
				applyCallbacks()
			}
		})
		$game_socket.on("invited", async (invitation, callback) => {
			console.log("Am being invited!")
			const r = await new Promise<"accepted" | "refused" | undefined>((resolve) => {
				const modal: ModalSettings = {
					type: "component",
					component: "AcceptGameInvitationModal",
					response: (r) => {
						modalStore.close()
						resolve(r)
					},
					meta: {
						username: invitation.username,
					},
				}
				modalStore.trigger(modal)
			})
			if (r) {
				callback(r)
				goto("/pong")
			}
		})
		$game_socket.on("updatedGameStatus", (new_data) => {
			if (new_data.status === "INVITING") {
                $banner_store.message == "Game invitation pending"
                $banner_store.pending = true
			}
            else if (new_data.status === "INVITED") {
                $banner_store.message == "You are being invited"
                $banner_store.pending = true
			}
            else {
                $banner_store.message == ""
                $banner_store.pending = false
            }
		})
	}

	onDestroy(() => {
		$game_socket.removeAllListeners()
		$game_socket.close()
		$sse_store.close()
	})

	setContext("game_socket", game_socket)
</script>

{#if $banner_store}
	<div class="relative">
		<span class="variant-filled-warning px-20 py-1 text-lg">Game Status</span>
	</div>
{/if}
<slot />

<!-- <button -->
<!-- 	on:click={() => { -->
<!-- 		console.log("click") -->
<!-- 		console.log($game_socket) -->
<!-- 	}} -->
<!-- 	class="absolute top-1/4 left-1/4 z-50 variant-ghost btn btn-sm">Show socket</button -->

<!-- > -->
<style>
	span {
		position: absolute;
		top: 50%;
		left: 50%;
		z-index: 999;
		border-top-left-radius: 2px;
		border-top-right-radius: 2px;
		border-bottom-left-radius: 10px;
		border-bottom-right-radius: 10px;
		transform: translate(-50%, -0%);
	}
</style>
