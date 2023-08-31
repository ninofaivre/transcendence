<script lang="ts">
	import type { GameSocket } from "$types"
	import type { ModalSettings } from "@skeletonlabs/skeleton"
	import type { Writable } from "svelte/store"

	// import { game_socket } from "$lib/global"
	import { PUBLIC_BACKEND_URL } from "$env/static/public"
	import { io } from "socket.io-client"
	import { onDestroy, setContext } from "svelte"
	import { getModalStore } from "@skeletonlabs/skeleton"
	import { writable } from "svelte/store"
	import { get } from "svelte/store"
	import { goto } from "$app/navigation"

	console.log("private layout init")

	const modalStore = getModalStore()

	let game_socket: Writable<GameSocket> = writable(
		io(PUBLIC_BACKEND_URL, {
			withCredentials: true,
		}),
	)

	applyCallbacks()

	function applyCallbacks() {
		console.log("Applying layout callbacks on $game_socket:", $game_socket.id)
		$game_socket.on("connect", () => {
			console.log("connect!")
		})
		$game_socket.io.on("reconnect", () => {
			console.log("reconnect!")
		})
		$game_socket.io.on("reconnect_attempt", () => {
			console.log("reconnect_attempt!")
		})
		$game_socket.on("disconnect", (data) => {
			console.log(data)
			if (data === "io server disconnect") {
				$game_socket = io(PUBLIC_BACKEND_URL, {
					withCredentials: true,
				})
			}
			console.log("applying callbacks for layout !")
			applyCallbacks()
		})
		$game_socket.on("connect_error", (data) => {
			// console.log("connect_error", data)
			console.log("connect_error")
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
	}

	onDestroy(() => {
		$game_socket.removeAllListeners()
		console.log("private layout destroy", $game_socket)
		$game_socket.close()
	})

	setContext("game_socket", game_socket)
</script>

<button
	on:click={() => {
		console.log("click")
		console.log($game_socket)
	}}
	class="variant-ghost btn btn-sm absolute left-1/4 top-1/4 z-50">Show socket</button
>

<slot />
