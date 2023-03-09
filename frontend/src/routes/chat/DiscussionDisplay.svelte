<script lang="ts">

	import type Discussion from '$types'
	import { current_user } from '$lib/stores'

	let discussion = [];
	export let discussionId: number
	$: {
		fetch(window.location.origin + '/users/getnMessages', {
			method: 'POST',
			headers: { 'Content-Type' : 'application/json', },
			body: JSON.stringify({

				discussionId,
				start: discussion.length
			})
		})
		.catch( (err) => { alert(err) })
		.then( (response) => { response.json() })
		.catch( (json_err) => { alert(`Could not parse jsons: ${json_err}`) })
	}

</script>

<h2>
	{ discussion.title || discussion.users }
</h2>

{#if !discussion.messages?.length }
	<p> This conversation has not started yet </p>
{:else}
	{#each discussion.messages as message}
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
