<script lang="ts">
	import { T, extend, useFrame, useThrelte } from "@threlte/core"
	import { Vector3 } from "three"
	import { createEventDispatcher } from "svelte"
	import Paddle from "./Paddle.svelte"
	import Ball from "./Ball.svelte"
	import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

	const { size, renderer, invalidate } = useThrelte()
	$: zoom = $size.width / 256

	// useFrame((state, delta) => {})
	extend({ OrbitControls })

	// General parameters

	const dispatch = createEventDispatcher()

	export let d_from_walls = 0
	export let court = {
		w: 100,
		h: (100 * 9) / 16,
	}

	export let lpaddle = {
		x: 0 + d_from_walls,
		z: court.h / 2,
		w: court.w / 32,
		h: court.h / 4,
	}

	export let rpaddle = {
		x: 0 + court.w - d_from_walls,
		z: court.h / 2,
		w: court.w / 32,
		h: court.h / 4,
	}

	export let ball = {
		x: court.w / 2,
		z: court.h / 2,
		r: 1,
	}

	export let top_wall = {
		x: court.w / 2,
		z: 0,
		w: court.w,
		h: 1,
	}
	export let bottom_wall = {
		x: court.w / 2,
		z: court.h,
		w: court.w,
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
	position={[court.w / 2, 100, court.h / 2]}
	on:create={({ ref }) => {
		ref.lookAt(new Vector3(court.w / 2, -1, court.h / 2))
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
<Paddle paddle={bottom_wall} />
<!-- <Paddle paddle={right_wall} /> -->
<!-- <Paddle paddle={left_wall} /> -->
