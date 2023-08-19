<script lang="ts">
	import { T } from "@threlte/core"
	import type { MeshBasicMaterialParameters } from "three"
	import { Paddle, Ball } from "./GameObjects"
	import { writable } from "svelte/store"
	import { PUBLIC_BACKEND_URL } from "$env/static/public"
	import { io } from "socket.io-client"
	import { onMount } from "svelte"

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
</script>

<T.PerspectiveCamera
	makeDefault
	position={[10, 10, 10]}
	on:create={({ ref }) => {
		ref.lookAt(1, 1, 0)
	}}
/>

<!-- Left paddle -->
<T.Mesh x={lpaddle.x} y={lpaddle.y}>
	<T.BoxGeometry args={[lpaddle.width, lpaddle.height, 0]} />
	<T.MeshBasicMaterial args={[{ color: paddle_color }]} />
</T.Mesh>

<!-- Right paddle -->
<T.Mesh x={rpaddle.x} y={rpaddle.y}>
	<T.BoxGeometry args={[rpaddle.width, rpaddle.height, 0]} />
	<T.MeshBasicMaterial args={[{ color: paddle_color }]} />
</T.Mesh>

<!-- Ball  -->
<T.Mesh x={ball.x} y={ball.y}>
	<T.BoxGeometry args={[ball.r, ball.r, 0]} />
	<T.MeshBasicMaterial args={[{ color: ball_color }]} />
</T.Mesh>
