<script lang="ts">
	import type { GameDim } from "contract"
	import type { Position } from "contract"

	import { T, extend, useFrame, useThrelte } from "@threlte/core"
	import { Vector3 } from "three"
	import { createEventDispatcher } from "svelte"
	import Paddle from "./Paddle.svelte"
	import Ball from "./Ball.svelte"
	import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

	const { size, renderer, invalidate } = useThrelte()
	$: zoom = $size.width / 128

	extend({ OrbitControls })
	const dispatch = createEventDispatcher()

	type Size = (typeof GameDim)["paddle"]

	// General parameters

	export let court: Size
	export let ball_sz: Size
	export let lpaddle_sz: Size
	export let rpaddle_sz: Size
	export let ball_pos: Position
	export let lpaddle_pos: Position
	export let rpaddle_pos: Position

	$: ball = {
		x: ball_pos.x,
		z: ball_pos.y,
		w: ball_sz.width,
		h: ball_sz.height,
	}
	$: lpaddle = {
		x: lpaddle_pos.x,
		z: lpaddle_pos.y,
		w: lpaddle_sz.width,
		h: lpaddle_sz.height,
	}
	$: rpaddle = {
		x: rpaddle_pos.x,
		z: rpaddle_pos.y,
		w: rpaddle_sz.width,
		h: rpaddle_sz.height,
	}
	let top_wall = {
		x: court.width / 2,
		z: 0,
		w: court.width,
		h: 1,
	}
	let bottom_wall = {
		x: court.width / 2,
		z: court.height,
		w: court.width,
		h: 1,
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
				dispatch("UP")
			case "ArrowDown":
				dispatch("DOWN")
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

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
	position={[court.width / 2, 100, court.height / 2]}
	on:create={({ ref }) => {
		ref.lookAt(new Vector3(court.width / 2, -1, court.height / 2))
	}}
></T.OrthographicCamera>

<!-- Ball -->
<!-- <Ball {ball} /> -->
<Paddle paddle={ball} />
<!-- Left paddle  -->
<Paddle paddle={lpaddle} />
<!-- Right paddle  -->
<Paddle paddle={rpaddle} />

<!-- Court Walls -->
<Paddle paddle={top_wall} />
<Paddle paddle={bottom_wall} />
<!-- <Paddle paddle={right_wall} /> -->
<!-- <Paddle paddle={left_wall} /> -->
