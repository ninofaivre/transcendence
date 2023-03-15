
<script lang=ts>
	import { deleteCookie } from '$lib/global'

	function logOut()
	{
		deleteCookie('access_token')
		window.location.href = window.location.origin
	}

</script>

<nav>
  <a href="/">Home</a>
  <a href="/pong">Pong</a>
  <a href="/chat">Chat</a>
  <button on:click={ logOut }> Log Out </button>
</nav>

<main>
    <slot></slot>
</main>

<style>
    nav {
        position: sticky;
        top: 0px;
    }
</style>
