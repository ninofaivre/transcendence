<script lang="ts">
	import { Paddle, Ball } from "./GameObjects"
	import { writable } from "svelte/store"
	import { PUBLIC_BACKEND_URL } from "$env/static/public"
	import { io } from "socket.io-client"
	import { onDestroy } from "svelte"

	const game_socket = io(PUBLIC_BACKEND_URL)
	const game_socket_store = writable(game_socket)
	onDestroy(game_socket.close)

	//	$game_socket_store.on('ennemy_paddle', (message) => {
	//	  })
	//
	//	$: {
	//		$game_socket_store.emit('eventFromClient', $reactiveValue)
	//	}

	// General parameters
	export const interval = 1

	// Sizing
	export const margin = 100
	export const height = window.innerHeight - margin
	export const aspect_ratio = 16 / 9

	let width = height * aspect_ratio
	$: width = height * aspect_ratio

	let border_width = 5
	let paddle_height = height / 4
	let paddle_width = border_width * 2

	// Colors
	let court_color = "black"
	let border_color = "green"
	let paddle_color = "orange"
	let ball_color = "red"

	// Initial object positioning
	const ball_position = { x: width / 2, y: height / 2 }

	const ball_startx = width / 2
	const ball_starty = height / 2
	const ball_size = border_width * 1.5
	const lpaddle_startx = width / 30
	const lpaddle_starty = height / 2 - paddle_height / 2
	const rpaddle_startx = width - width / 30
	const rpaddle_starty = height / 2 - paddle_height / 2

	// Game variables
	let playing = false
	let left_score = 0
	let right_score = 0
	Paddle.speed = 10

	let lpaddle = new Paddle(lpaddle_startx, lpaddle_starty, paddle_width, paddle_height)
	let rpaddle = new Paddle(rpaddle_startx, rpaddle_starty, paddle_width, paddle_height)
	let ball = new Ball(ball_startx, ball_starty, ball_size)

	function animate() {
		if (playing) {
			const interval_obj = setInterval(moveBall, interval)
			return () => {
				clearInterval(interval_obj)
			}
		}
		throw Error(
			"Logic error: animate function should not be called when playing is set to false",
		)
	}
	let destroy: ReturnType<typeof animate>

	function moveBall() {
		console.log("moveBall")
		if (ball.x < 0) {
			left_score++
			ball.reset()
			return
		}
		if (ball.x > width) {
			right_score++
			ball.reset()
			return
		}
		if (ball.y < 0 || ball.y > height) {
			ball.dy *= -1
		}
		if (ball.collides(lpaddle) || ball.collides(rpaddle)) {
			ball.dx *= -1
		}
		const ball_position: [number, number] = ball.update()
		;[ball.x, ball.y] = ball_position
	}

	function startPlaying() {
		console.log("startPlaying")
		if (!playing) {
			playing = true
			destroy = animate()
		}
	}

	function pause() {
		console.log("pause")
		playing = false
		destroy()
	}

	function reset() {
		console.log("reset")
		playing = false
		ball = ball.reset()
		lpaddle = lpaddle.reset()
		rpaddle = rpaddle.reset()
		left_score = right_score = 0
		destroy()
	}

	function handleKeydown(e: KeyboardEvent) {
		console.log(`You entered ${e.key}`)
		if (playing) {
			switch (e.code) {
				case "KeyW":
					if (lpaddle.y > 0) lpaddle.y -= Paddle.speed
					return
				case "KeyS":
					if (lpaddle.y + lpaddle.height < height) lpaddle.y += Paddle.speed
					return
				case "ArrowUp":
					if (rpaddle.y > 0) rpaddle.y -= Paddle.speed
					return
				case "ArrowDown":
					if (rpaddle.y + rpaddle.height < height) rpaddle.y += Paddle.speed
					return
				default:
					pause()
			}
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div id="game-container" on:click={pause}>
	<div id="left-score">{left_score}</div>
	<div id="right-score">{right_score}</div>
	{#if !playing}
		<div id="menu-container">
			<button id="play-button" class="menu-buttons" on:click|stopPropagation={startPlaying}>
				PLAY
			</button>
			<button id="reset-button" class="menu-buttons" on:click|stopPropagation={reset}>
				RESET
			</button>
		</div>
	{/if}
	<svg {width} {height} style:border={`${border_width}px solid ${border_color}`}>
		<rect x="0" y="0" {width} {height} stroke={court_color} fill={court_color} />
		<line
			x1={width / 2}
			y1="0"
			x2={width / 2}
			y2={height}
			stroke={border_color}
			stroke-width={border_width}
			stroke-dasharray="10"
		/>
		<rect
			id="left_paddle"
			x={lpaddle.x}
			y={lpaddle.y}
			width={paddle_width}
			height={paddle_height}
			fill={paddle_color}
		/>
		<rect
			id="right_paddle"
			x={rpaddle.x}
			y={rpaddle.y}
			width={paddle_width}
			height={paddle_height}
			fill={paddle_color}
		/>
		<circle id="ball" cx={ball.x} cy={ball.y} r={ball.r} fill={ball_color} />
	</svg>
</div>

<style>
	#game-container {
		color: red;
		display: flex;
		align-items: center;
		justify-content: center;
		/* Has to be relative so that the scores with position:absolute are contained */
		position: relative;
	}
	#menu-container {
		position: absolute;
		display: flex;
		flex-direction: column;
	}

	#left-score,
	#right-score,
	#play-button,
	#reset-button {
		font-family: "Press Start 2P", Arial;
		font-size: 22px;
		font-weight: bold;
	}
	#left-score,
	#right-score {
		top: 10%;
		position: absolute;
	}
	#left-score {
		left: 25%;
	}
	#right-score {
		right: 25%;
	}

	.menu-buttons {
		color: black;
		background-color: green;
		border: 2px solid white;
		border-radius: 2px;
		padding-top: 5px;
		padding-left: 7px;
	}
	.menu-buttons:hover {
		color: green;
		background-color: white;
		border: 2px solid green;
	}
</style>
