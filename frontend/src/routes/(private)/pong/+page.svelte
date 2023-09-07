<script lang="ts">
	import type { Position } from "contract"
	import type { GameSocket } from "$types"
	import type { Writable } from "svelte/store"
	import type { PageData } from "./$types"

	import { ProgressRadial } from "@skeletonlabs/skeleton"
	import { Canvas } from "@threlte/core"
	import { Text, HTML } from "@threlte/extras"
	import Pong from "./Pong.svelte"
	import { getContext  } from "svelte"
	import { GameDim } from "contract"
	import { injectLookAtPlugin } from "./lookAtPlugin"

	injectLookAtPlugin()
	export let data: PageData

	let my_paddle_is_left: boolean = false
	let state: "IDLE" | "INIT" | "PAUSE" | "BREAK" | "PLAY" | "QUEUE" | "END" | "RECONNECT" | "INVITING" | "INVITED"

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
	let paddleLeftDisplayName = ""
	let paddleRightDisplayName = ""
	let paddleLeftScore = 0
	let paddleRightScore = 0
	let timeout = 0
	let value = 0
	let progress: number
	$: progress = (value * 100) / timeout

	let game_socket: Writable<GameSocket> = getContext("game_socket")

	$game_socket.emit("getGameStatus", "", (new_data) => {
		state = new_data.status
		console.log(new_data)
	})

	// game_socket.test = 42
	applyCallback()

	let winner = "none"

	function applyCallback() {
		console.log("Applying pong callback to socket:", $game_socket.id) //, $game_socket.test)
		//Receive data
		$game_socket.on("updatedGamePositions", (data) => {
			;({ ball: ball_pos, paddleLeft: lpaddle_pos, paddleRight: rpaddle_pos } = data)
		})
		$game_socket.on("newInGameMessage", (data) => {})
		$game_socket.on("updatedGameStatus", (new_data) => {
			console.log(new_data)
			state = new_data.status
			if (new_data.status === "INIT" || new_data.status === "RECONNECT") {
				my_paddle_is_left = new_data.paddleLeftDisplayName === data.me.userName
				;({ paddleLeftDisplayName, paddleRightDisplayName } = new_data)
				;({ paddleLeftScore, paddleRightScore } = new_data)
				if (new_data.status === "INIT") {
					new_data
					timeout = new_data.timeout / 1000
					value = timeout
					button_disabled = false
					for (let i = 0; i < timeout; ++i) {
						setTimeout(() => {
							value -= 1
						}, 1000 * i)
					}
				}
			} else if (new_data.status === "BREAK") {
				;({ paddleLeftScore, paddleRightScore } = new_data)
				timeout = new_data.timeout / 1000
				value = timeout
				button_disabled = false
				for (let i = 0; i < timeout; ++i) {
					setTimeout(() => {
						value -= 1
					}, 1000 * i)
				}
			} else if (new_data.status === "PAUSE") {
				// Implemeting the timeout
			} else if (new_data.status === "END") {
				;({ paddleLeftScore, paddleRightScore } = new_data)
				winner = new_data.winnerDisplayName
			}
		})
		$game_socket.on("disconnect", (data) => {
			if (data === "io server disconnect") {
				// console.log("applying callbacks for pong page")
				// applyCallback()
			}
		})
	}

	function createGame() {
		console.log("Clicked to create")
		$game_socket.emit("queue", "")
		button_disabled = true
	}
	function cancelGame() {
		console.log("Cancelled game")
		$game_socket.emit("deQueue", "")
		button_disabled = false
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
	function surrend() {
		$game_socket.emit("surrend", "")
	}
</script>

<div class="menu-container grid grid-cols-1">
	{#if state === "PAUSE"}
		<div class="justify-self self-center">
			<div>
				Waiting for {data.me.userName === paddleLeftDisplayName
					? paddleRightDisplayName
					: paddleLeftDisplayName}
			</div>
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
			class="variant-ringed-primary btn rounded"
			on:click={createGame}
			disabled={button_disabled}
		>
			PLAY
		</button>
	{:else if state === "QUEUE"}
		<div class="card grid grid-rows-2 gap-2 p-8">
			<button class="variant-ringed-error btn rounded" on:click={cancelGame}>CANCEL</button>
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
		<div class="grid grid-rows-2 gap-1">
			{#if winner === data.me.userName}
				<div>🎉 You won 🎉</div>
			{:else}
				<div>
					📉 {winner} has won 📉
				</div>
			{/if}
			<button
				class="variant-ringed-error btn rounded"
				on:click={createGame}
				disabled={button_disabled}
			>
				PLAY AGAIN ?
			</button>
		</div>
	{/if}
</div>

<Canvas frameloop="demand" debugFrameloop={false}>
	<Text
		text={paddleLeftDisplayName}
		fontSize={100}
		up={[0, -1, 0]}
		lookAt={[0, 0, -1]}
		font="/arcadeclassic.regular.ttf"
		anchorX={-court.width / 2 + 400}
		anchorY={court.height / 2 - 400}
	/>
	<Text
		text={paddleRightDisplayName}
		fontSize={100}
		up={[0, -1, 0]}
		lookAt={[0, 0, -1]}
		font="/arcadeclassic.regular.ttf"
		anchorX={-court.width / 2 - 400}
		anchorY={court.height / 2 - 400}
	/>
	<Text
		text={paddleLeftScore.toString()}
		fontSize={100}
		up={[0, -1, 0]}
		lookAt={[0, 0, -1]}
		anchorX={-court.width / 2 + 400}
		anchorY={court.height / 2 - 300}
		font="/arcadeclassic.regular.ttf"
	/>
	<Text
		text={paddleRightScore.toString()}
		fontSize={100}
		up={[0, -1, 0]}
		lookAt={[0, 0, -1]}
		anchorX={-court.width / 2 - 400}
		anchorY={court.height / 2 - 300}
		font="/arcadeclassic.regular.ttf"
	/>
	<HTML position.x={court.width + 50} position.y={230}>
		<button
			on:click={surrend}
			class="btn bg-orange-500 text-xs px-2 w-fit"
            style:font-family="ArcadeClassic"
            style:font-size="2rem"
		>
			Surrend
		</button>
	</HTML>
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
	.menu-container {
		display: grid;
		position: absolute;
		grid-template-rows: 100vh;
		grid-template-columns: 100vw;
	}

	.menu-container > div,
	button {
		align-self: center;
		font-family: "ArcadeClassic", monospace;
        justify-self: center;
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
