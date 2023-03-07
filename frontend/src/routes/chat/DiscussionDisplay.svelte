<script lang="ts">

	import type Discussion from '$types'
	import { current_user } from '$lib/stores'

	export let discussion: Discussion = {
		name: "Example discussion",
		users: ['alice', 'bob', 'charlotte'],
		messages: [
			'Hi alice !',
				'Hi bob. How are you ?',
			'I am fine, thx',
		]
	}

</script>

<h2>
	{ discussion.name || discussion.users }
</h2>

{#if !discussion.messages?.length }
	<p> This conversation has not started yet </p>
{:else}
	{#each discussion.messages as message}
		{#if message.author == $current_user }
			<div class="my-messages" > { `${message.data}` } </div>
		{:else}
			<div class="other-messages"  > { `${message.author}: ${message.data}` } </div>
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
