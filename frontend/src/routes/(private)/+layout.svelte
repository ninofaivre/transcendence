<script lang="ts">
	import type { Socket } from "socket.io-client"
	import type { ClientToServerEvents, ServerToClientEvents } from "contract"
	import { setContext } from "svelte"
	import { io } from "socket.io-client"
	import { PUBLIC_BACKEND_URL } from "$env/static/public"

	let game_socket: Socket<ClientToServerEvents, ServerToClientEvents> = io(PUBLIC_BACKEND_URL, {
		withCredentials: true,
	})
	game_socket.on("disconnect", () => {
		console.log("Game socket renewed !")
		game_socket = io(PUBLIC_BACKEND_URL)
	})
	setContext("game_socket", game_socket)
</script>

<slot />
