<script lang="ts">
	import { T, extend, useFrame, useThrelte } from "@threlte/core"
	import type { MeshBasicMaterialParameters } from "three"
	import * as GameObjects from "./GameObjects"
	import { writable } from "svelte/store"
	import { PUBLIC_BACKEND_URL } from "$env/static/public"
	import { io } from "socket.io-client"
	import { onMount } from "svelte"
	import Paddle from "./Paddle.svelte"
	import Ball from "./Ball.svelte"
	import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

	// const game_socket = io(PUBLIC_BACKEND_URL)
	// const game_socket_store = writable(game_socket)

	// onMount(() => {
	// 	//Receive data
	// 	$game_socket_store.on("ennemy_paddle", (message) => {
	// 		console.log(message)
	// 	})

	// 	// Send data
	// 	// $game_socket_store.emit('eventFromClient', $reactiveValule)

	// 	return $game_socket_store.close
	// })

	extend({ OrbitControls })
	const { renderer, invalidate } = useThrelte()

	useFrame((state, delta) => {})
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
	const ball_startx = width / 2
	const ball_starty = height / 2
	const ball_size = border_width * 1.5

	const lpaddle_startx = -width / 30
	const rpaddle_startx = width / 30

	const lpaddle_starty = height / 2 - paddle_height / 2
	const rpaddle_starty = height / 2 - paddle_height / 2

	// Game variables
	let playing = true
	let left_score = 0
	let right_score = 0
	GameObjects.Paddle.speed = 100

	let lpaddle = new GameObjects.Paddle(
		lpaddle_startx,
		lpaddle_starty,
		paddle_width,
		paddle_height,
		// paddle_color,
		"blue",
	)
	let rpaddle = new GameObjects.Paddle(
		rpaddle_startx,
		rpaddle_starty,
		paddle_width,
		paddle_height,
		// paddle_color,
		"green",
	)
	let ball = new GameObjects.Ball(ball_startx, ball_starty, ball_size, ball_color)

	function handleKeydown(e: KeyboardEvent) {
		if (playing) {
			console.log(`You entered ${e.key}`)
			switch (e.code) {
				case "KeyW":
					lpaddle.y -= GameObjects.Paddle.speed
					lpaddle = lpaddle
					return
				case "KeyS":
					lpaddle.y += GameObjects.Paddle.speed
					lpaddle = lpaddle
					return
				case "ArrowUp":
					rpaddle.y -= GameObjects.Paddle.speed
					rpaddle = rpaddle
					return
				case "ArrowDown":
					rpaddle.y += GameObjects.Paddle.speed
					rpaddle = rpaddle
					return
				default:
			}
			invalidate("moved")
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- Camera -->
<T.PerspectiveCamera makeDefault position={[0, 0, 100]} let:ref>
	<T.OrbitControls args={[ref, renderer.domElement]} on:change={invalidate} />
</T.PerspectiveCamera>

<!-- Ball -->
<Ball {ball} />
<!-- Left paddle  -->
<Paddle paddle={lpaddle} />
<!-- Right paddle  -->
<Paddle paddle={rpaddle} />
