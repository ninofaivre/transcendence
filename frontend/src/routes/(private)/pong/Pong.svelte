<script lang="ts">
	import type { GameDim } from "contract"
	import type { Position } from "contract"

	import { T, extend, useThrelte } from "@threlte/core"
	import { Vector3 } from "three"
	import { createEventDispatcher } from "svelte"
	import Paddle from "./Paddle.svelte"
	import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
	import { injectLookAtPlugin } from "./lookAtPlugin"

	export let court: Size = {
		width: 1600,
		height: 900,
	}
	export let ball_sz: Size
	export let lpaddle_sz: Size
	export let rpaddle_sz: Size
	export let ball_pos: Position
	export let lpaddle_pos: Position
	export let rpaddle_pos: Position
	export let wall_width = lpaddle_sz.width
	export let ball_color = "red"
	export let court_color = "green"
	export let lpaddle_color = "green"
	export let rpaddle_color = "green"

	const { size } = useThrelte()

	$: zoom = ($size.width * (70 / 100)) / court.width

	extend({ OrbitControls })
	const dispatch = createEventDispatcher()

	type Size = (typeof GameDim)["paddle"]

	// General parameters
	let bite = 0
	let top_wall = {
		position: {
			x: court.width / 2,
			y: 0 - wall_width / 2 + bite,
		},
		size: {
			width: court.width,
			height: wall_width,
		},
	}
	let bottom_wall = {
		position: {
			x: court.width / 2,
			y: court.height + wall_width / 2 - bite,
		},
		size: {
			width: court.width,
			height: wall_width,
		},
	}
	// let left_wall = {
	// 	x: 0,
	// 	z: court.h / 2,
	// 	w: 1,
	// 	h: court.h,
	// }
	// let right_wall = {
	// 	x: court.w,
	// 	z: court.h / 2,
	// 	w: 1,
	// 	h: court.h,
	// }

	function handleKeydown(e: KeyboardEvent) {
		switch (e.code) {
			case "ArrowUp":
			case "KeyK":
				dispatch("UP")
				break
			case "ArrowDown":
			case "KeyJ":
				dispatch("DOWN")
				break
		}
	}

	injectLookAtPlugin()
</script>

<svelte:window on:keydown={handleKeydown} on:keyup={() => dispatch("NONE")} />

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
<!-- <T.OrthographicCamera -->
<!-- 	makeDefault -->
<!-- 	{zoom} -->
<!-- 	position={[court.width / 2, 100, court.height / 2]} -->
<!-- 	on:create={({ ref }) => { -->
<!-- 		ref.lookAt(new Vector3(court.width / 2, -1, court.height / 2)) -->
<!-- 	}} -->
<!-- ></T.OrthographicCamera> -->

<!-- in front camera -->
<T.OrthographicCamera
	makeDefault
	{zoom}
	position={[court.width / 2, court.height / 2, -100]}
	up={[0, -1, 0]}
	on:create={({ ref }) => {
		ref.lookAt(new Vector3(court.width / 2, court.height / 2, 1))
	}}
></T.OrthographicCamera>

<!-- Test orientation with this -->
<!-- <Paddle position={{ x: 300, y: 300 }} size={ball_sz} color="blue" /> -->

<!-- Ball -->
<!-- <Ball {ball} /> -->
<Paddle position={ball_pos} size={ball_sz} color={ball_color} />
<!-- Left paddle  -->
<Paddle position={lpaddle_pos} size={lpaddle_sz} color={lpaddle_color} />
<!-- Right paddle  -->
<Paddle position={rpaddle_pos} size={rpaddle_sz} color={rpaddle_color} />

<!-- Court Walls -->
<Paddle position={top_wall.position} size={top_wall.size} color={court_color} />
<Paddle position={bottom_wall.position} size={bottom_wall.size} color={court_color} />
<!-- <Paddle paddle={right_wall} /> -->
<!-- <Paddle paddle={left_wall} /> -->
