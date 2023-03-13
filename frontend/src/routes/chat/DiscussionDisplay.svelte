<script lang="ts">
// DiscussionDisplay.svelte 

import type { Message } from '$lib/types'
import type { InfiniteEvent } from 'svelte-infinite-loading/types/index';

import InfiniteLoading from 'svelte-infinite-loading';
import ChatBox from './ChatBox.svelte';

export let my_name: string
export let displayed_messages: Message[]; // Exported so that incoming messages can be added
export let discussionId: number // To detect change of current conversation
$: switchMessages(discussionId)

const initial_load = 10
const reactivity = 10
const switchMessages = async ( _discussionId: typeof discussionId ) => 
{
    let fetched_messages;
    try   {
        const response = await fetch(window.location.origin + '/users/getnMessages/' + discussionId
            + '?n=' + initial_load
        )
        fetched_messages = await response.json()
    } catch (err: any) { // Can't type what's caught because it could catch anything
        alert("Could not fetch conversation:" + err.message + "\n Try to reload the page")
        return;
    }
    if (_discussionId === discussionId)
        displayed_messages = fetched_messages
}

let loading_greediness = 2
const api: string = window.location.origin + '/users/getnMessages/'

function infiniteHandler( e: InfiniteEvent )
{
    const { detail: {loaded, complete}} = e
    if (displayed_messages)
    {
        fetch(`${api}` + discussionId + '?'
            + 'start=' +  displayed_messages.length  
            + '&' +
            'n=' + loading_greediness
        )
            .then(response => response.json())
            .then(fetched_messages =>
            {
                    if (fetched_messages.length > 0)
                {
                        displayed_messages = [ ...fetched_messages, ...displayed_messages]
                        loaded();
                    } else {
                        complete();
                    }
            });
    }
}

	 
</script>

<div id=message-box
>
	{#if !displayed_messages?.length }

		<p> This conversation has not started yet </p>

	{:else}

        <InfiniteLoading on:infinite={infiniteHandler} direction="top" distance={reactivity} />
        {#each displayed_messages as message}
			{#if message.from == my_name }
				<div class="my-messages" > { `${message.id}: ${message.content}` } </div>
			{:else}
				<div class="other-messages"  > { `${message.from}: ${message.id}: ${message.content}` } </div>
			{/if}
		{/each}

	{/if}
    <ChatBox {discussionId} />
</div>

<style>

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
