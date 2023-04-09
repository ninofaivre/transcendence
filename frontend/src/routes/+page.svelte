<script>

	import Auth from './Auth.svelte'

	let logged_in = false

</script>

<!--{#if !logged_in}-->

	<Auth bind:logged_in/>

<!--{/if}-->
