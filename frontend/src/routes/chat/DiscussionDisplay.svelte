<script lang="ts">

	// DiscussionDisplay.svelte 

	import { beforeUpdate, afterUpdate } from 'svelte'

	let history_loader_reactivity = 0
	let loading_greediness = 2
	let history_beginning_reached = false
	async function handleScroll( e: ScrollEvent )
	{
		if ( e.target.scrollTop <= history_loader_reactivity )
		{
			if (!history_beginning_reached)
			{
				console.log("Handling scroll")
				console.log(displayed_messages[0])
				let fetched_messages;
				try   {
					const response = await fetch(window.location.origin + '/users/getnMessages/' + discussionId
						+ '?start=' + displayed_messages[0].id
						+ '&n=' + loading_greediness
					)
					fetched_messages = await response.json()
				} catch (err) {
					alert("Sorry. Could not get history of previous conversation:" + err.message)
					return;
				}
				if (fetched_messages.length < loading_greediness)
					history_beginning_reached = true
				if (fetched_messages.length > 0)
					displayed_messages = [ fetched_messages, ...displayed_messages]
			}
		}
	}

	const initial_load = 10
 	const switchMessages = async ( _discussionId ) => 
	{
		history_beginning_reached = false
		let fetched_messages;
		try   {
			const response = await fetch(window.location.origin + '/users/getnMessages/' + discussionId
				+ '?n=' + initial_load
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
			 chatbox && chatbox.offsetHeight + chatbox.scrollTop > chatbox.scrollHeight - 20 // Ideally the height of a bubble ?
			 && console.log(`${chatbox.offsetHeight} + ${chatbox.scrollTop} > ${chatbox.scrollHeight} - 20`)
		console.log(autoscroll)
	 });

	afterUpdate(() => {
		if (autoscroll && chatbox) 
			chatbox.scrollTo(0, chatbox.scrollHeight) // elt.scrollHeight is the bottom, 0 is the top
	 });
	 
</script>

<div id=message-box
	 on:scroll|stopImmediatePropagation={ handleScroll }
	 bind:this={ chatbox }
	 style:height={ `${window.innerHeight / 2}px` }
>
	{#if !displayed_messages?.length }
		<p> This conversation has not started yet </p>
	{:else}
		{#if history_beginning_reached }
			<p>This is the beginning of your conversation<p/>
		{/if}
		{#each displayed_messages as message}
			{#if message.from == my_name }
				<div class="my-messages" > { `${message.id}: ${message.content}` } </div>
			{:else}
				<div class="other-messages"  > { `${message.from}: ${message.id}: ${message.content}` } </div>
			{/if}
		{/each}
	{/if}
</div>

<style>
	#message-box {
		overflow-y: scroll;
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
