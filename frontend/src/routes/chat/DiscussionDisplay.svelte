<script lang="ts">

	// DiscussionDisplay.svelte 

	const fetchMessages = async ( discussionId ) => 
	{
		fetch(window.location.origin + '/users/getnMessages/' + discussionId
		//+ '?start=' + 1
		//+ '&n=' + 1
		)
		.catch( (err) => { alert(err) })
		.then( (response) =>  response.json() )
		.catch( (json_err) => { alert(`Could not parse json: ${json_err}`) })
		.then( (new_messages) => { messages = new_messages })
		//.then( (new_messages) => { messages = [...messages, ...new_messages] })
	}

	import type Discussion from '$types'
	import { current_user } from '$lib/stores'

	let messages = [];
	export let discussion
	export let discussionId: number
	$: fetchMessages(discussionId)

</script>

<h2>
	{ discussion.title || discussion.users }
</h2>

{#if !messages?.length }
	<p> This conversation has not started yet </p>
{:else}
	{#each messages as message}
		{#if message.author == $current_user }
			<div class="my-messages" > { `${message.content}` } </div>
		{:else}
			<div class="other-messages"  > { `${message.from}: ${message.content}` } </div>
		{/if}
	{/each}
{/if}

<style>
	div {
		border: solid 1px black;
		border-radius: 5px;
	}
	
	.my-messages   {
		background-color: lightgreen;
		text-align: right;
	}

	.other-messages   {
		background-color: lightblue;
		text-align: left;
	}
	
</style>
