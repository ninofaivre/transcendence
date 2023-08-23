<script lang="ts">
	import { T } from "@threlte/core"

	// Sizing
	export let ball: {
		x: number
		z: number
		r: number
		color?: string
	}
</script>

<!-- Ball  -->
<T.Mesh position.x={ball.x} position.z={ball.z}>
	<T.SphereGeometry args={[ball.r]} />
	<T.MeshBasicMaterial args={[{ color: ball.color }]} />
</T.Mesh>
