<script lang="ts">
	import { T, extend, useFrame, useThrelte } from "@threlte/core"
	import { Vector3, type MeshBasicMaterialParameters } from "three"
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
	const { size, renderer, invalidate } = useThrelte()
	$: zoom = $size.width / 256

	useFrame((state, delta) => {})

	// General parameters

	let innerWidth: number

	// Sizing
	export let width = window.innerWidth
	$: width = innerWidth
	export let aspect_ratio = 9 / 16

	let height = width * aspect_ratio
	$: height = width * aspect_ratio

	let paddle_height = height / 4
	let paddle_width = width / 20

	// Colors
	let court_color = "black"
	let border_color = "green"
	let paddle_color = "orange"
	let ball_color = "red"

	// Initial object positioning
	const court_init = {
		width: 100,
		height: (100 * 9) / 16,
	}
	const ball_init = {
		x: 0,
		y: 0,
		r: 1,
		color: "red",
	}
	const paddle_init = {
		x: 0,
		y: 0,
		width: 1,
		height: court_init.height / 4,
		color: "orange",
	}
	const ball_speed = 10

	const ball_startx = 0
	const ball_starty = 0
	const ball_size = 1

	const lpaddle_startx = -width / 30
	const rpaddle_startx = width / 30

	const lpaddle_starty = height / 2 - paddle_height / 2
	const rpaddle_starty = height / 2 - paddle_height / 2

	// Game variables
	let playing = true
	let left_score = 0
	let right_score = 0

	let d_from_walls = 10
	let court = {
		w: 100,
		h: (100 * 9) / 16,
	}

	let lpaddle = {
		x: 0 + d_from_walls,
		z: court.h / 2,
		w: court.w / 64,
		h: court.h / 4,
	}

	let rpaddle = {
		x: 0 + court.w - d_from_walls,
		z: court.h / 2,
		w: court.w / 64,
		h: court.h / 4,
	}

	let ball = {
		x: court.w / 2,
		z: court.h / 2,
		r: 1,
	}

	let top_wall = {
		x: court.w / 2,
		z: 0,
		w: court.w,
		h: 1,
	}
	let left_wall = {
		x: 0,
		z: court.h / 2,
		w: 1,
		h: court.h,
	}
	let right_wall = {
		x: court.w,
		z: court.h / 2,
		w: 1,
		h: court.h,
	}
	let bottom_wall = {
		x: court.w / 2,
		z: court.h,
		w: court.w,
		h: 1,
	}

	function handleKeydown(e: KeyboardEvent) {
		if (playing) {
			switch (e.code) {
				case "ArrowUp":
				// send "move-up"
				case "ArrowDown":
				// send "move-down"
			}
		}
	}
</script>

<svelte:window bind:innerWidth on:keydown={handleKeydown} />

<!-- Camera -->
<!-- <T.PerspectiveCamera makeDefault {zoom} position={[court_init.width, - court_init.height / 2, 100]} let:ref> -->
<!-- <T.PerspectiveCamera makeDefault {zoom} position={[0, 0, 100]} let:ref> -->
<!-- 	<T.OrbitControls -->
<!-- 		args={[ref, renderer.domElement]} -->
<!-- 		on:change={invalidate} -->
<!-- 		on:create={({ ref }) => { -->
<!-- 			ref.lookAt(new Vector3(0, 0, -1)) -->
<!-- 		}} -->
<!-- 	/> -->
<!-- </T.PerspectiveCamera> -->

<!-- above camera -->
<T.OrthographicCamera
	makeDefault
	{zoom}
	position={[court.w / 2, 100, court.h / 2]}
	on:create={({ ref }) => {
		ref.lookAt(new Vector3(court.w/2, -1, court.h/2))
	}}
></T.OrthographicCamera>

<!-- Ball -->
<Ball {ball} />
<!-- Left paddle  -->
<Paddle paddle={lpaddle} />
<!-- Right paddle  -->
<Paddle paddle={rpaddle} />

<!-- Court Walls -->
<Paddle paddle={top_wall} />
<Paddle paddle={right_wall} />
<Paddle paddle={left_wall} />
<Paddle paddle={bottom_wall} />
