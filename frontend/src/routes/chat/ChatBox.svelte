<script lang="ts">

	export let messages: string[] 

	let msg = ""

	function sendMessage() {
		messages = [...messages, msg]
		msg = "";
	}

	function handleKeypress(event: KeyboardEvent) {
		switch (event.key) {
			case 'Enter':
				sendMessage();
		}
	}

</script>

<textarea bind:value={msg} on:keypress={ handleKeypress }/>
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
