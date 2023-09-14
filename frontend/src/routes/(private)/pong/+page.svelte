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
	import { GameDim, GameSpeed } from "contract"
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
		if (payload.status === "INIT" || payload.status === "RECONNECT")
			({ paddleLeftDisplayName, paddleRightDisplayName } = payload)
        if (payload.status === "INIT" || payload.status === "BREAK" || payload.status === "RECONNECT")
			({ paddleLeftScore, paddleRightScore } = payload)
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


<Canvas frameloop="demand" debugFrameloop={false}>
	<Text
		text={paddleLeftDisplayName}
		fontSize={60}
		outlineColor="black"
		outlineWidth={14}
		up={[0, -1, 0]}
		lookAt={[0, 0, -1]}
		font="/arcadeclassic.regular.ttf"
		anchorX={-court.width / 2 + 500 + paddleLeftDisplayName.length * 10}
		anchorY={court.height / 2 - 550}
	/>
	<Text
		text={paddleRightDisplayName}
		fontSize={60}
		outlineColor="black"
		outlineWidth={14}
		up={[0, -1, 0]}
		lookAt={[0, 0, -1]}
		font="/arcadeclassic.regular.ttf"
		anchorX={-court.width / 2 - 400 + paddleRightDisplayName.length * 10}
		anchorY={court.height / 2 - 550}
	/>
	<Text
		text={paddleLeftScore.toString()}
		outlineColor="black"
		outlineWidth={20}
		fontSize={80}
		up={[0, -1, 0]}
		lookAt={[0, 0, -1]}
		anchorX={-court.width / 2 + 400}
		anchorY={court.height / 2 - 300}
		font="/arcadeclassic.regular.ttf"
	/>
	<Text
		text={paddleRightScore.toString()}
		fontSize={80}
		outlineColor="black"
		outlineWidth={20}
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
    <HTML position.x={court.width/2} position.y={court.height/2 + 150} center={true}>
        {#if state.status !== "PLAY"}
            <div style:font-family="ArcadeClassic" class="pt-16 h-64 w-64 flex flex-col place-items-center gap-2 p-3 bg-surface-900 rounded" >
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
                        class="variant-ringed-primary btn rounded "
                        on:click={createGame}
                        disabled={button_disabled}
                    >
                        PLAY
                    </button>
                {:else if state.status === "QUEUE"}
                        <button class="variant-ringed-error btn rounded" on:click={cancelGame}>CANCEL</button>
                        <ProgressRadial width="w-16"/>
                {:else if state.status === "INIT"}
                    <div class="flex flex-col items-center gap-4">
                        {#if state.hostIntraName === data.me.userName}
                            <form
                                on:submit|preventDefault={(e) => sendSettings(new FormData(e.currentTarget))}
                                class="variant-filled-error grid grid-rows-4 relative items-center rounded-md p-6 outline outline-white bottom-24"
                            >
                                <RangeSlider
                                    name="initial_speed"
                                    max={max_init_speed}
                                    min={min_init_speed}
                                    step={50}
                                    value={GameSpeed.ball}
                                >
                                    <div class="my-4 flex items-center justify-between">
                                        <div class="font-bold">Initial speed</div>
                                    </div>
                                </RangeSlider>
                                <RangeSlider
                                    name="acceleration"
                                    max={max_acceleration}
                                    min={min_acceleration}
                                    step={1}
                                    value={GameSpeed.ballAccelPercentage}
                                >
                                    <div class="my-4 flex items-center justify-between">
                                        <div class="font-bold">Acceleration</div>
                                    </div>
                                </RangeSlider>
                                <label class="mb-0">
                                    Exponential acceleration?
                                    <input
                                        name="is-exponential"
                                        type="checkbox"
                                        class="checkbox mt-0"
                                        checked
                                    />
                                </label >
                                <button type="submit" class="variant-filled-warning btn rounded-md">
                                    Proceed with game
                                </button>
                            </form>
                        {:else}
                            <div>Found Game</div>
                            <div class="">
                                <ProgressRadial bind:value={progress} width="w-32" font={100}>
                                    {value}
                                </ProgressRadial>
                            </div>
                        {/if}
                    </div>
                    {:else if state.status === "END"}
                    <div class="grid grid-rows-2 gap-1 place-items-center">
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
                            PLAY AGAIN
                        </button>
                    </div>
                {/if}
            </div>
        {/if}
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
