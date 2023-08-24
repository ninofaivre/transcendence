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
<T.Mesh position.x={position.x} position.z={position.y}>
	<T.BoxGeometry args={[size.width, 1, size.height]} />
	<T.MeshBasicMaterial args={[{ color }]} />
</T.Mesh>
