<script lang="ts">

	import type { message } from '$types'
	import { current_user } from '$lib/stores'

	export let messages: message[] 

	let msg: message = {
		author: $current_user,
		data: ""
	}

	function sendMessage() {
		messages = [...messages, {...msg}] // Shallow copy
		msg.data = "";
	}

	function handleKeypress(event: KeyboardEvent) {
		switch (event.key) {
			case 'Enter':
				sendMessage();
		}
	}

</script>

<div style:position=fixed style:bottom=5%>
	<textarea bind:value={msg.data} on:keypress={ handleKeypress }/>
	<button on:click={ sendMessage }> Send </button>
</div>

<style>

	/* textarea {
		position: fixed;
		bottom: 5%;
	}
	button {
		position: fixed;
		bottom: 1%;
	} */

</style>
