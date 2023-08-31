<script lang="ts">
	import { T } from "@threlte/core"

	export let position: {
		x: number
		y: number
	}

	export let size: {
		width: number
		height: number
	}

	export let color = "green"
</script>

<!-- Paddle  -->
<T.Mesh position.x={position.x} position.y={position.y}>
	<T.BoxGeometry args={[size.width, size.height, 1]}  />
	<T.MeshBasicMaterial args={[{ color }]} />
</T.Mesh>
