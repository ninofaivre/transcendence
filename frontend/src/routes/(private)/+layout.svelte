<script lang="ts">
	import type { GameSocket } from "$types"
	import { ProgressRadial, type ModalSettings } from "@skeletonlabs/skeleton"
	import type { Writable } from "svelte/store"

	import { PUBLIC_BACKEND_URL } from "$env/static/public"
	import { io } from "socket.io-client"
	import { onDestroy, setContext } from "svelte"
	import { getModalStore } from "@skeletonlabs/skeleton"
	import { writable } from "svelte/store"
	import { goto } from "$app/navigation"
	import { logged_in } from "$stores"
    import type { zConnectErrorData } from 'contract'
	import type { z } from "zod"
	import { client } from "$clients"

	console.log("private layout init")
	const modalStore = getModalStore()

	let banner_message = ""
	let banner_pending = false
	let banner_message_store = writable(banner_message)
	let banner_pending_store = writable(banner_pending)

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

    ;(window as any)['game'] = { 
        ping() {
            const start = Date.now()
            $game_socket.emit("ping", "", () => {
                console.log(`ping : ${Date.now() - start}`)        
            })
        }
    }

	$game_socket.emit("getGameStatus", "", (new_data) => {
		if (new_data.status === "INVITING") {
			banner_message_store.set("Game invitation pending")
			$banner_pending_store = true
		} else if (new_data.status === "INVITED") {
			banner_message_store.set("You are being invited")
			$banner_pending_store = true
		} else if (new_data.status === "RECONNECT") {
			goto("/pong")
		}
	})
    $game_socket.on("connect_error", async ({ message, data }: { message: string, data?: z.infer<typeof zConnectErrorData> }) => {
        console.log("CONNECT_ERROR")
        console.log(`errorMessage : ${message}`)
        if (!data)
            return ;
        console.log(`errorData: ${data}`)
        if (data.code === 'NotFoundUserForValidToken') {
            console.log(`loging out on websocket connect_error`)
            logged_in.set(false)
            return ;
        }
        console.log("websocket trying to refreshTokens...")
        const ret = await client.auth.refreshTokens({ body: null })
        if (ret.status !== 200) {
            console.log("refreshTokens failed, loggint out")
            logged_in.set(false)
            return ;
        }
        console.log("refreshTokens success !")
        const reconnectFail = () => {
            console.log("connect failed after refreshTokens, logging out")
            $game_socket.off('connect', reconnectSuccess)
            logged_in.set(false)
        }
        const reconnectSuccess = () => {
            $game_socket.off('connect_error', reconnectFail)
        }
        $game_socket.once('connect_error', reconnectFail)
        $game_socket.once('connect', reconnectSuccess)
        $game_socket.connect()
    })
    $game_socket.on("disconnect", (data) => {
        console.log("DISCONNECT")
        if (data === "io server disconnect")
            $game_socket.connect()
    })
    $game_socket.on("invited", async (invitation, callback) => {
        banner_message_store.set("You are being invited")
        banner_pending_store.set(true)
        const r = await new Promise<"accepted" | "refused" | undefined>((resolve) => {
            const modal: ModalSettings = {
                type: "component",
                component: "AcceptGameInvitationModal",
                response: (r) => {
                    modalStore.close()
                    resolve(r)
                },
                meta: {
                    username: invitation.displayName,
                },
            }
            modalStore.trigger(modal)
        })
        if (r) {
            callback(r)
            if (r === "accepted") goto("/pong")
        }
    })
    $game_socket.on("updatedGameStatus", (new_data) => {
        console.log("updatedGameStatus layout", new_data)
        if (new_data.status === "INVITING") {
            banner_message_store.set("Game invitation pending")
            banner_pending_store.set(true)
        } else if (new_data.status === "INVITED") {
            banner_message_store.set("You are being invited")
            banner_pending_store.set(true)
        } else {
            modalStore.close()
            banner_message_store.set("")
            banner_pending_store.set(true)
        }
    })

	onDestroy(() => {
		$game_socket.removeAllListeners()
		$game_socket.close()
		$sse_store.close()
	})

	setContext("game_socket", game_socket)
</script>

{#if $banner_message_store}
	<div class="relative">
		<span class="variant-filled-warning flex justify-between py-1 text-lg">
			<div class="px-2">{$banner_message_store}</div>
			{#if $banner_pending_store}
				<div class="self-center px-2">
					<ProgressRadial width="w-4" />
				</div>
			{/if}
		</span>
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
