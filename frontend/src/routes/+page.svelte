<script>

	import Auth from './Auth.svelte'

	let logged_in = false

</script>

{#if logged_in}

<h1> TRANSCENDANCE </h1>

<div><a href="/pong">PLAY</a></div>

<div><a href="/chat">CHAT</a></div>

{:else}

	<Auth/>

{/if}

<style>
</style>
