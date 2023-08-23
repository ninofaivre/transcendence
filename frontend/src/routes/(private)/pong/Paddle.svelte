<script lang="ts">
	import { T } from "@threlte/core"

	// Sizing
	export let paddle: {
		x: number
		z: number
		w: number
		h: number
		color?: string
	}
</script>

<!-- Paddle  -->
<T.Mesh position.x={paddle.x} position.z={paddle.z}>
	<T.BoxGeometry args={[paddle.w, 1, paddle.h]} />
	<T.MeshBasicMaterial args={[{ color: paddle.color }]} />
</T.Mesh>
