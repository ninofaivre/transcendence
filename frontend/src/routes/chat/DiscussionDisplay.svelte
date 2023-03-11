<script lang="ts">

	// DiscussionDisplay.svelte 

	import { beforeUpdate, afterUpdate } from 'svelte'

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


	export let discussionId: number // To detect change of current conversation
	$: switchMessages(discussionId)

	export let displayed_messages = []; // Exported so that incoming messages can be added

	export let my_name

	let n_displayed = 10

	let chatbox: HTMLDivElement
	let autoscroll
	beforeUpdate(()	=> {
		autoscroll	=
			 chatbox && chatbox.offsetHeight + chatbox.scrollTop > chatbox.scrollHeight - 20;
	 });

	afterUpdate(() => {
		if (autoscroll && chatbox) 
			chatbox.scrollTo(0, chatbox.scrollHeight); // elt.scrollHeight is the bottom
	 });
</script>

<div id=message-box bind:this={ chatbox } style:height={ `${window.innerHeight / 2}px` }>
	{#if !displayed_messages?.length }
		<p> This conversation has not started yet </p>
	{:else}
		<!--{#each displayed_messages.splice(n_displayed) as message}-->
		{#each displayed_messages as message}
			{#if message.from == my_name }
				<div class="my-messages" > { `${message.content}` } </div>
			{:else}
				<div class="other-messages"  > { `${message.from}: ${message.content}` } </div>
			{/if}
		{/each}
	{/if}
</div>

<style>
	#message-box {
		overflow: scroll;
	}

	.my-messages, .other-messages  {
		border: solid 1px black;
		border-radius: 5px;
		margin: 1% 5%;
		padding: 5px;
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
