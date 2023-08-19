<script lang="ts">
	import { T } from "@threlte/core"
	import type { MeshBasicMaterialParameters } from "three"
	import type { Ball } from "./GameObjects"

	// Sizing
	export let ball: Ball
    console.log(`ball position: {x: ${ball.x}, y: ${ball.y}`)
</script>

<!-- Ball  -->
<T.Mesh x={ball.x} y={ball.y}>
	<T.BoxGeometry args={[ball.r, ball.r, 1]} />
	<T.MeshBasicMaterial args={[{ color: ball.color }]} />
</T.Mesh>
