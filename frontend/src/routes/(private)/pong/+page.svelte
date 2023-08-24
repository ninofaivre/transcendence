<script lang="ts">
	import { type Socket, io } from "socket.io-client"
	import type { ServerToClientEvents, ClientToServerEvents } from "contract"

	import { Canvas } from "@threlte/core"
	import Pong from "./Pong.svelte"

	import { PUBLIC_BACKEND_URL } from "$env/static/public"
	import { onMount } from "svelte"

	let game_socket: Socket<ServerToClientEvents, ClientToServerEvents>
	let my_paddle_is_left: boolean = false
	let my_score = 0
	let other_score = 0

	onMount(() => {
		game_socket = io(PUBLIC_BACKEND_URL)

		//Receive data
		game_socket.on("updatedGamePositions", (message) => {
			console.log(message)
		})
		game_socket.on("newInGameMessage", (message) => {
			console.log(message)
		})
		game_socket.on("updatedGameStatus", (message) => {
			console.log(message)
		})

		// Emit data
		game_socket.emit("queue", "")
		game_socket.emit("deQueue", "")

		game_socket.emit("newInGameMessage", "UP")
		game_socket.emit("gameMoovement", "UP")

		return game_socket.close
	})
</script>

<div>
	<span>{my_paddle_is_left ? my_score : other_score}</span>
	<span>{my_paddle_is_left ? other_score : my_score}</span>
</div>
<Canvas frameloop="demand" debugFrameloop={false}>
	<Pong />
</Canvas>

<style>
	span {
		position: absolute;
		top: 20%;
	}
</style>
