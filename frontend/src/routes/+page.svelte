<script>

	import Auth from './Auth.svelte'

	let logged_in = false

</script>

<h1> TRANSCENDANCE </h1>

{#if logged_in}

<div><a href="/pong">PLAY</a></div>

<div><a href="/chat">CHAT</a></div>

{:else}

	<Auth bind:logged_in/>

{/if}

<style>
</style>
