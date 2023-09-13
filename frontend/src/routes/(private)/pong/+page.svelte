<script lang="ts">
	import type { FlattenUnionObjectByDiscriminator, GameStatus, Position } from "contract"
	import type { GameSocket } from "$types"
	import type { Writable } from "svelte/store"
	import type { PageData } from "./$types"

	import { ProgressRadial, RangeSlider } from "@skeletonlabs/skeleton"
	import { Canvas } from "@threlte/core"
	import { Text, HTML } from "@threlte/extras"
	import Pong from "./Pong.svelte"
	import { getContext } from "svelte"
	import { GameDim } from "contract"
	import { injectLookAtPlugin } from "./lookAtPlugin"
	import { rulesSchema } from "contract"

	injectLookAtPlugin()
	export let data: PageData

	let state: GameStatus = { status: "IDLE" }

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
	let lpaddle_pos: Position = { x: lpaddle_sz.width / 2, y: court.height / 2 }
	let rpaddle_pos: Position = { x: court.width - rpaddle_sz.width / 2, y: court.height / 2 }

	// Settings
	let min_init_speed = rulesSchema.shape.ballBaseSpeed.minValue ?? undefined
	let max_init_speed = rulesSchema.shape.ballBaseSpeed.maxValue ?? undefined
	let min_acceleration = rulesSchema.shape.ballAccelPercentage.minValue ?? undefined
	let max_acceleration = rulesSchema.shape.ballAccelPercentage.maxValue ?? undefined

	// Utils
	let button_disabled = false
	let paddleLeftDisplayName = ""
	let paddleRightDisplayName = ""
	let paddleLeftScore = 0
	let paddleRightScore = 0
	let timeout = 0
	let value = 0
	let progress: number
	let timeoutId: number | null = null
	$: progress = (value * 100) / timeout

	let game_socket: Writable<GameSocket> = getContext("game_socket")

	function spinLoop(status: GameStatus["status"]) {
		if (state.status !== status) {
			timeoutId = null
			return
		}
		value -= 1
		if (value > 0) timeoutId = window.setTimeout(spinLoop, 1000, status)
		else timeoutId = null
	}

	function initSpin(ms: number, status: GameStatus["status"]) {
		if (timeoutId) clearTimeout(timeoutId)
		timeout = ms / 1000
		value = Math.floor(timeout)
		button_disabled = false
		timeoutId = window.setTimeout(spinLoop, 1000, status)
	}

	function handleGameStatus(payload: GameStatus) {
		console.log("pong gameStatus :", payload)
		state = payload
		if (payload.status === "INIT" || payload.status === "RECONNECT") {
			;({ paddleLeftDisplayName, paddleRightDisplayName } = payload)
			;({ paddleLeftScore, paddleRightScore } = payload)
			if (payload.status === "RECONNECT") return
		}
		if (payload.status === "INIT" || payload.status === "BREAK" || payload.status === "PAUSE") {
			initSpin(payload.timeout, payload.status)
			return
		}
		if (payload.status === "END") {
			;({ paddleLeftScore, paddleRightScore } = payload)
		}
	}

	$game_socket.on("updatedGameStatus", (payload) => {
		handleGameStatus(payload)
	})

	$game_socket.on("updatedGamePositions", (data) => {
		;({ ball: ball_pos, paddleLeft: lpaddle_pos, paddleRight: rpaddle_pos } = data)
	})

	$game_socket.emit("getGameStatus", "", (payload) => {
		if (
			payload.status === "QUEUE" ||
			payload.status === "IDLE" ||
			payload.status === "INVITED" ||
			payload.status === "INVITING"
		) {
			handleGameStatus(payload)
			return
		}
		;({ paddleLeftDisplayName, paddleRightDisplayName } = payload)
		;({ paddleLeftScore, paddleRightScore } = payload)
		handleGameStatus(payload)
	})

	$game_socket.on("newInGameMessage", (data) => {})

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

	let ball_color: string = "#ff0000"
	let court_color: string = "#008000"
	let lpaddle_color: string = "#008000"
	let rpaddle_color: string = "#008000"

	function sendSettings(formData: FormData) {
		const ballBaseSpeed = Number(formData.get("initial_speed"))
		const ballAccelPercentage = Number(formData.get("acceleration"))
		const ballAccelType = Boolean(formData.get("is-exponential")) ? "exponential" : "linear"

		$game_socket.emit("setRules", { ballBaseSpeed, ballAccelPercentage, ballAccelType })
	}
</script>

<div class="menu-container grid grid-cols-1">
	{#if state.status === "PAUSE"}
		<div class="justify-self self-center">
			<div>
				Waiting for {state.pausingDisplayName}
			</div>
			<div class="justify-self-center">
				<ProgressRadial bind:value={progress} width="w-32" font={100}>
					{value}
				</ProgressRadial>
			</div>
		</div>
	{:else if state.status === "BREAK"}
		<div class="grid grid-rows-2 gap-1">
			<div>READY ?</div>
			<div class="justify-self-center">
				<ProgressRadial bind:value={progress} width="w-32" font={100}>
					{value}
				</ProgressRadial>
			</div>
		</div>
	{:else if state.status === "IDLE"}
		<button
			class="variant-ringed-primary btn rounded"
			on:click={createGame}
			disabled={button_disabled}
		>
			PLAY
		</button>
	{:else if state.status === "QUEUE"}
		<div class="card grid grid-rows-2 gap-2 p-8">
			<button class="variant-ringed-error btn rounded" on:click={cancelGame}>CANCEL</button>
			<div class="spinner justify-self-center" />
		</div>
	{:else if state.status === "INIT"}
		<div class="grid grid-rows-2 gap-1">
			<div>FOUND A GAME !</div>
			<div class="justify-self-center">
				<ProgressRadial bind:value={progress} width="w-32" font={100}>
					{value}
				</ProgressRadial>
			</div>
			{#if state.hostIntraName === data.me.userName}
				<form
					on:submit|preventDefault={(e) => sendSettings(new FormData(e.currentTarget))}
					class="variant-filled-error grid h-1/2 w-1/2 grid-rows-4 items-center gap-8 rounded-md p-6 text-xs outline outline-white"
				>
					<RangeSlider
						name="initial_speed"
						max={max_init_speed}
						min={min_init_speed}
						step={50}
					>
						<div class="mb-4 flex items-center justify-between">
							<div class="font-bold">Initial speed</div>
						</div>
					</RangeSlider>
					<RangeSlider
						name="acceleration"
						max={max_acceleration}
						min={min_acceleration}
						step={10}
					>
						<div class="mb-4 flex items-center justify-between">
							<div class="font-bold">Acceleration</div>
						</div>
					</RangeSlider>
					<label for="exponential_or_linear" class="mb-0">
						Exponential acceleration?</label
					>
					<input
						id="exponential_or_linear"
						name="is-exponential"
						type="checkbox"
						class="checkbox"
					/>
					<button type="submit" class="variant-filled-warning btn rounded-md">
						Proceed with game
					</button>
				</form>
			{/if}
		</div>
	{:else if state.status === "END"}
		<div class="grid grid-rows-2 gap-1">
			{#if state.winnerDisplayName === data.me.displayName}
				<div>🎉 You won 🎉</div>
			{:else}
				<div>
					📉 {state.winnerDisplayName} has won 📉
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
		<div class="flex flex-col gap-3" style:font-family="ArcadeClassic">
			<button
				on:click={surrend}
				class="btn w-fit bg-orange-500 px-2 text-xs"
				style:font-size="2rem"
			>
				Surrend
			</button>
			<fieldset class="variant-ringed mt-4 flex flex-col justify-center gap-3 rounded-md p-4">
				<legend class="variant-filled-tertiary rounded-md p-1 text-sm">
					Change game colors
				</legend>
				<div class="grid grid-cols-[1fr_auto] gap-2" style:font-size="1rem">
					<div>Left paddle</div>
					<input bind:value={lpaddle_color} class="input" type="color" />
				</div>
				<div class="grid grid-cols-[1fr_auto] gap-2" style:font-size="1rem">
					<div class="">Right paddle</div>
					<input bind:value={rpaddle_color} class="input" type="color" />
				</div>
				<div class="grid grid-cols-[1fr_auto] gap-2" style:font-size="1rem">
					<div>ball</div>
					<input bind:value={ball_color} class="input" type="color" />
				</div>
				<div class="grid grid-cols-[1fr_auto] gap-2" style:font-size="1rem">
					<div>Court</div>
					<input bind:value={court_color} class="input" type="color" />
				</div>
			</fieldset>
		</div>
	</HTML>
	<Pong
		{court}
		{ball_sz}
		{ball_pos}
		{lpaddle_sz}
		{lpaddle_pos}
		{rpaddle_sz}
		{rpaddle_pos}
		{ball_color}
		{court_color}
		{lpaddle_color}
		{rpaddle_color}
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
