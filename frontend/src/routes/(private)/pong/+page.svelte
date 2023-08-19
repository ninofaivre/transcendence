<script>
	import { Canvas } from "@threlte/core"
	import Pong from "./Pong.svelte"
</script>

<Canvas frameloop="demand" debugFrameloop={false}>
	<Pong />
</Canvas>
