<script lang="ts">
	import { type Socket, io } from "socket.io-client"
	import type { ServerToClientEvents, ClientToServerEvents, Position } from "contract"

	import { Canvas } from "@threlte/core"
	import Pong from "./Pong.svelte"

	import { PUBLIC_BACKEND_URL } from "$env/static/public"
	import { onMount } from "svelte"
	import { GameDim } from "contract"

	let game_socket: Socket<ServerToClientEvents, ClientToServerEvents>
	let my_paddle_is_left: boolean = false
	let my_score = 0
	let other_score = 0
	let state: "IDLE" | "INIT" | "PAUSE" | "BREAK" | "PLAY" = "IDLE"

	// Fixed sizings
	let court: (typeof GameDim)["court"] = GameDim.court
	let ball_sz: (typeof GameDim)["paddle"] = {
		width: GameDim.ballSideLength,
		height: GameDim.ballSideLength,
	}
	let lpaddle_sz: (typeof GameDim)["paddle"] = GameDim.paddle
	let rpaddle_sz: (typeof GameDim)["paddle"] = GameDim.paddle

	// Positions
	let ball_pos: Position = { x: court.width / 2, y: court.height / 2 }
	let lpaddle_pos: Position = { x: 0, y: court.height / 2 }
	let rpaddle_pos: Position = { x: court.width, y: court.height / 2 }

    // Utils
    let button_disabled = false

	onMount(() => {
		game_socket = io(PUBLIC_BACKEND_URL, {
            withCredentials: true,
        })
		//Receive data
		game_socket.on("updatedGamePositions", (data) => {
            console.log(data)
			;({ ball: ball_pos, paddleLeft: lpaddle_pos, paddleRight: rpaddle_pos } = data)
		})
		game_socket.on("newInGameMessage", (data) => {})
		game_socket.on("updatedGameStatus", (data) => {
            console.log(data)
			state = data.status
		})
		game_socket.on("disconnect", (data) => {
            console.log(data)
			state = "IDLE"
		})

		return game_socket.close
	})

	function createGame() {
        console.log("Clicked to create")
		game_socket.emit("queue", "")
        button_disabled = true
	}

	function cancelGame() {
        console.log("Cancelled game")
		game_socket.emit("deQueue", "")
	}

    function onUP() {
        console.log("UP")
		game_socket.emit("gameMovement", "UP")
    }
    function onDOWN() {
        console.log("DOWN")
		game_socket.emit("gameMovement", "DOWN")
    }
</script>

<div id="left-score" style:--score-color={my_paddle_is_left ? "red" : "green"}>
	{my_paddle_is_left ? my_score : other_score}
</div>
<div id="right-score" style:--score-color={my_paddle_is_left ? "green" : "red"}>
	{my_paddle_is_left ? other_score : my_score}
</div>
<div class="menu-container">
	{#if state === "PAUSE"}
		<div class="menu-buttons">Waiting for user (spinner here)</div>
	{:else if state === "BREAK"}
		<div class="menu-buttons">READY ?</div>
	{:else if state === "IDLE"}
		<button
			class="menu-buttons btn variant-ringed-primary rounded"
			on:click={createGame}
            disabled={button_disabled}
		>
			PLAY
		</button>
	{:else if state === "INIT"}
		<button
			class="menu-buttons rounde btn variant-ringed-error"
			on:click={cancelGame}
		>
			CANCEL
		</button>
	{/if}
</div>
<Canvas frameloop="demand" debugFrameloop={false}>
	<Pong {court} {ball_sz} {ball_pos} {lpaddle_sz} {lpaddle_pos} {rpaddle_sz} {rpaddle_pos} on:UP={onUP} on:DOWN={onDOWN}/>
</Canvas>

<style>
	#left-score,
	#right-score {
		position: absolute;
		top: 30%;
	}
	#left-score {
		--score-color: white;
		right: 25%;
		color: var(--score-color);
	}
	#right-score {
		--score-color: white;
		left: 25%;
		color: var(--score-color);
	}

	.menu-container {
		position: absolute;
		top: 50%;
		left: 50%;
	}
</style>
