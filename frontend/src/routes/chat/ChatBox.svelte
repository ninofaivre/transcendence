<script lang="ts">

	import type { message } from '$types'
	import { current_user } from '$lib/stores'

	export let messages: message[] 

	let msg: message = {
		author: $current_user,
		data: ""
	}

	function sendMessage() {
		messages = [...messages, msg]
		msg.data = "";
	}

	function handleKeypress(event: KeyboardEvent) {
		switch (event.key) {
			case 'Enter':
				sendMessage();
		}
	}

</script>

<textarea bind:value={msg.data} on:keypress={ handleKeypress }/>
<!--<textarea bind:value={msg} />-->
<button on:click={ sendMessage }> Send </button>

<style>

	textarea {
		position: fixed;
		bottom: 5%;
	}
	button {
		position: fixed;
		bottom: 1%;
	}

</style>
