<script lang="ts">

	// DiscussionDisplay.svelte 

	const switchMessages = async ( _discussionId ) => 
	{
		let fetched_messages;
		try   {
			const response = await fetch(window.location.origin + '/users/getnMessages/' + discussionId
			//+ '?start=' + 1
			//+ '&n=' + 1
			)
			fetched_messages = await response.json()
		} catch (err) {
			alert("Could not fetch conversation:" + err.message + "\n Try to reload the page")
			return;
		}
		if (_discussionId === discussionId)
			displayed_messages = fetched_messages
	}

	import { current_user } from '$lib/stores'

	export let discussionId: number // To detect change of current conversation
	$: switchMessages(discussionId)

	export let displayed_messages = []; // Exported so that incoming messages can be added

	export let my_name

</script>

{#if !displayed_messages?.length }
	<p> This conversation has not started yet </p>
{:else}
	{#each displayed_messages as message}
		{#if message.from == my_name }
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
