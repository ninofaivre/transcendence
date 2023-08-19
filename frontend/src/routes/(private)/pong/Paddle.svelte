<script lang="ts">
	import { T } from "@threlte/core"
	import type { MeshBasicMaterialParameters } from "three"
	import type { Paddle } from "./GameObjects"

	// Sizing
	export let paddle: Paddle
	console.log(`paddle position: {x: ${paddle.x}, y: ${paddle.y}`)
</script>

<!-- Paddle  -->
<T.Mesh position.x={paddle.x} position.y={paddle.y}>
	<T.BoxGeometry args={[paddle.width, paddle.height, 1]} />
	<T.MeshBasicMaterial args={[{ color: paddle.color }]} />
</T.Mesh>
