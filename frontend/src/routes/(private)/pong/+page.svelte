<script lang="ts">
	import { type Socket, io } from "socket.io-client"
	import type { ServerToClientEvents, ClientToServerEvents, Position } from "contract"

	import { Canvas } from "@threlte/core"
	import Pong from "./Pong.svelte"

	import { PUBLIC_BACKEND_URL } from "$env/static/public"
	import { onMount } from "svelte"
	import { GameDim } from "contract"
	import { my_name } from "$stores"

	let game_socket: Socket<ServerToClientEvents, ClientToServerEvents>
	let my_paddle_is_left: boolean = false
	let my_score = 0
	let other_score = 0
	let state: "IDLE" | "INIT" | "PAUSE" | "BREAK" | "PLAY" | "WAITING" | "END" = "IDLE"

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
	let paddleLeftUserName = ""
	let paddleRightUserName = ""
    let paddleLeftScore = 0
    let paddleRightScore = 0

	onMount(() => {
		game_socket = io(PUBLIC_BACKEND_URL, {
			withCredentials: true,
		})
		//Receive data
		game_socket.on("updatedGamePositions", (data) => {
			// console.log(data)
			;({ ball: ball_pos, paddleLeft: lpaddle_pos, paddleRight: rpaddle_pos } = data)
		})
		game_socket.on("newInGameMessage", (data) => {})

		game_socket.on("updatedGameStatus", (data) => {
			console.log(data)
			state = data.status
			if (data.status === "INIT") {
				my_paddle_is_left = data.paddleLeftUserName === $my_name
				;({ paddleLeftUserName, paddleRightUserName } = data)
                button_disabled = false
			} else if (data.status === "BREAK") {
                ({paddleLeftScore, paddleRightScore} = data)
			} else if (data.status === "PAUSE") {
			} else if (data.status === "END") {
			}
		})

		game_socket.on("disconnect", (data) => {
			console.log(data)
			state = "IDLE"
		})

		return () => game_socket.close()
	})

	function createGame() {
		console.log("Clicked to create")
		game_socket.emit("queue", "")
		button_disabled = true
		state = "WAITING"
	}

	function cancelGame() {
		console.log("Cancelled game")
		game_socket.emit("deQueue", "")
		button_disabled = false
		state = "IDLE"
	}

	function onUP() {
		console.log("UP")
		game_socket.emit("gameMovement", "UP")
	}
	function onDOWN() {
		console.log("DOWN")
		game_socket.emit("gameMovement", "DOWN")
	}
	function onNONE() {
		console.log("NONE")
		game_socket.emit("gameMovement", "NONE")
	}
</script>

<div
	id="left-score"
	class="grid grid-rows-2 gap-2"
	style:--score-color={my_paddle_is_left ? "red" : "green"}
>
	<div>
		{paddleLeftUserName}
	</div>
	<div class="justify-self-center">
		{paddleLeftScore}
	</div>
</div>
<div
	id="right-score"
	class="grid grid-rows-2 gap-2"
	style:--score-color={my_paddle_is_left ? "green" : "red"}
>
	<div>
		{paddleRightUserName}
	</div>
	<div class="justify-self-center">
		{paddleRightScore}
	</div>
</div>
<div class="menu-container grid grid-cols-1">
	{#if state === "PAUSE"}
		<div class="justify-self self-center">
			<div>Waiting for user</div>
			<div class="spinner" />
		</div>
	{:else if state === "BREAK"}
		<div class="">READY ?</div>
	{:else if state === "IDLE"}
		<button
			class="btn variant-ringed-primary rounded"
			on:click={createGame}
			disabled={button_disabled}
		>
			PLAY
		</button>
	{:else if state === "WAITING"}
		<div class="grid grid-rows-2 card gap-2 p-8">
			<button class="btn variant-ringed-error rounded" on:click={cancelGame}>CANCEL</button>
			<div class="spinner justify-self-center" />
		</div>
	{:else if state === "INIT"}
		<div class="" >
			FOUND A GAME !
		</div>
	{:else if state === "END"}
		<button class="btn variant-ringed-error rounded" on:click={createGame} disabled={button_disabled}>
	        REPLAY ?	
		</button>
	{/if}
</div>

<Canvas frameloop="demand" debugFrameloop={false}>
	<Pong
		{court}
		{ball_sz}
		{ball_pos}
		{lpaddle_sz}
		{lpaddle_pos}
		{rpaddle_sz}
		{rpaddle_pos}
		on:UP={onUP}
		on:DOWN={onDOWN}
		on:NONE={onNONE}
	/>
</Canvas>

<style>
	#left-score,
	#right-score {
		position: absolute;
		top: 30%;
		font-family: "Press Start 2P", "ArcadeClassic", serif;
		font-size: 1.4rem;
	}
	#left-score {
		--score-color: white;
		left: 25%;
		color: var(--score-color);
	}
	#right-score {
		--score-color: white;
		right: 25%;
		color: var(--score-color);
	}

	.menu-container {
		display: grid;
		position: absolute;
		grid-template-rows: 100vh;
		grid-template-columns: 100vw;
	}

	.menu-container > div,
	button, p {
		align-self: center;
		justify-self: center;
		font-family: "ArcadeClassic", "VT323", serif;
		font-size: 3rem;
	}

	.spinner {
		height: 0.6em;
		width: 0.6em;
		border: 1px solid;
		border-radius: 50%;
		border-top-color: transparent;
		border-bottom-color: transparent;
		align-self: center;
		animation: spin 0.8s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
