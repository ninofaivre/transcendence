<script lang="ts">

	import { onMount } from 'svelte'

	export let margin = 10
	export let rows = 1;
	export let cols = window.innerWidth - ( margin * 2 );
	export let placeholder = "Message"

	export let discussionId: number;
	let new_message: string;
	let disabled = false;

	async function sendMessage() {
		const headers =  {
			"Content-Type": "application/json",
		}
		disabled = true
		console.log("Fetching ", window.location.host + '/users/createMessage')
		fetch(window.location.origin + '/users/createMessage', {
			method: 'POST',
			headers,
			body: JSON.stringify( {
				discussionId,
				content: new_message,
			}),
		})
		.then(() => { new_message = "" })
		.catch((err) =>  { 
			console.log(err)
			alert(`Could not send message because ${err.message}`)
		})
		disabled = false
	}

	// Do I really need this to handle Enter ?
	async function handleKeypress(event: KeyboardEvent) {
		switch (event.key) {
			case 'Enter':
				sendMessage();
		}
	}

	onMount( () =>  {
	})

</script>

<div style:bottom=10px style:left={`${margin}px`} >
	<label for="textarea-input" hidden>
		Type your message here
	</label>
		<textarea id="textarea-input"
			bind:value={ new_message }
			on:keypress={ handleKeypress }
			{ rows }
			{ cols }
			{ disabled }
			{ placeholder }
		/>
	<button on:click={ sendMessage }> Send </button>
</div>

<style>

	div {
		position: sticky;
        background: rgba(128,128,128,1);
	}

	::placeholder { /* Chrome, Firefox, Opera, Safari 10.1+ */
	  color: grey;
	}

</style>
