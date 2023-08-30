<script lang="ts">
	import type { Position } from "contract"
	import type { GameSocket } from "$types"
	import type { Writable } from "svelte/store"

	import { ProgressRadial } from "@skeletonlabs/skeleton"
	import { Canvas } from "@threlte/core"
	import Pong from "./Pong.svelte"
	import { PUBLIC_BACKEND_URL } from "$env/static/public"
	import { getContext, onMount } from "svelte"
	import { GameDim } from "contract"
	import { my_name } from "$stores"
	import { io } from "socket.io-client"

	let my_paddle_is_left: boolean = false
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
	let timeout = 0
	let value = 0
	let progress: number
	$: progress = (value * 100) / timeout

	// let game_socket: GameSocket & { test?: number } = io(PUBLIC_BACKEND_URL, {
	// 	withCredentials: true,
	// })
	let game_socket: Writable<GameSocket> = getContext("game_socket")

	// game_socket.test = 42
	applyCallback()

	let winner = "none"

	function applyCallback() {
		console.log("Applying pong callback to socket:", $game_socket.id) //, $game_socket.test)
		//Receive data
		$game_socket.on("updatedGamePositions", (data) => {
			// console.log(data)
			;({ ball: ball_pos, paddleLeft: lpaddle_pos, paddleRight: rpaddle_pos } = data)
		})
		$game_socket.on("newInGameMessage", (data) => {})
		$game_socket.on("updatedGameStatus", (data) => {
			console.log(data)
			state = data.status
			if (data.status === "INIT") {
				my_paddle_is_left = data.paddleLeftUserName === $my_name
				;({ paddleLeftUserName, paddleRightUserName } = data)
				timeout = data.timeout / 1000
				value = timeout
				button_disabled = false
				for (let i = 0; i < timeout; ++i) {
					setTimeout(() => {
						value -= 1
					}, 1000 * i)
				}
			} else if (data.status === "BREAK") {
				;({ paddleLeftScore, paddleRightScore } = data)
				timeout = data.timeout / 1000
				value = timeout
				button_disabled = false
				for (let i = 0; i < timeout; ++i) {
					setTimeout(() => {
						value -= 1
					}, 1000 * i)
				}
			} else if (data.status === "PAUSE") {
			} else if (data.status === "END") {
				winner = data.winner
			}
		})
		$game_socket.on("disconnect", () => {
			console.log("pong disconnect")
			// let save = game_socket.test!
			state = "IDLE"
			// game_socket = io(PUBLIC_BACKEND_URL, { withCredentials: true })
			// game_socket.test = save * 2
			console.log("applying callbacks for pong page")
			applyCallback()
		})
	}

	function createGame() {
		console.log("Clicked to create")
		$game_socket.emit("queue", "")
		button_disabled = true
		state = "WAITING"
	}
	function cancelGame() {
		console.log("Cancelled game")
		$game_socket.emit("deQueue", "")
		button_disabled = false
		state = "IDLE"
	}
	function onUP() {
		console.log("UP")
		$game_socket.emit("gameMovement", "UP")
	}
	function onDOWN() {
		console.log("DOWN")
		$game_socket.emit("gameMovement", "DOWN")
	}
	function onNONE() {
		console.log("NONE")
		$game_socket.emit("gameMovement", "NONE")
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
		<div class="grid grid-rows-2 gap-1">
			<div>READY ?</div>
			<div class="justify-self-center">
				<ProgressRadial bind:value={progress} width="w-32" font={100}>
					{value}
				</ProgressRadial>
			</div>
		</div>
	{:else if state === "IDLE"}
		<button
			class="btn variant-ringed-primary rounded"
			on:click={createGame}
			disabled={button_disabled}
		>
			PLAY
		</button>
	{:else if state === "WAITING"}
		<div class="card grid grid-rows-2 gap-2 p-8">
			<button class="btn variant-ringed-error rounded" on:click={cancelGame}>CANCEL</button>
			<div class="spinner justify-self-center" />
		</div>
	{:else if state === "INIT"}
		<div class="grid grid-rows-2 gap-1">
			<div>FOUND A GAME !</div>
			<div class="justify-self-center">
				<ProgressRadial bind:value={progress} width="w-32" font={100}>
					{value}
				</ProgressRadial>
			</div>
		</div>
	{:else if state === "END"}
		{#if winner === $my_name}
			<div>🎉 You won! 🎉</div>
		{:else}
			<div>
				📉 {winner} has won ! 📉
			</div>
		{/if}
		<button
			class="btn variant-ringed-error rounded"
			on:click={createGame}
			disabled={button_disabled}
		>
			PLAY AGAIN ?
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
	button {
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
