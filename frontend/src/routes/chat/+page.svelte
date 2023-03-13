<script lang="ts">

	/* types */
    import type { Discussion as DiscussionType } from '$lib/types' // app.d.ts
	import type { PageData } from './$types'; // Generated type file
    import type { Message } from '$lib/types'
	
	/* Components */
	import DiscussionList from './DiscussionList.svelte'
	import DiscussionDisplay from './DiscussionDisplay.svelte'
	import CreateDiscussion from './CreateDiscussion.svelte'
	import { sse } from '$lib/sse'

	export let data: PageData

	let discussions: DiscussionType[]; // = Object.values(data);
	$: discussions = Object.values(data.discussions);

	let idx = 0 
	let all_messages: Message[][] = []

	//onDestroy(data.unsubscribe);

	sse.onmessage = ({ data }) =>
	{
		const parsedData = JSON.parse(data)
		const new_discussions = parsedData.test.discussions
		const new_messages = parsedData.test.messages
		if (!new_discussions?.length && !new_messages?.length)
			return
		if ( new_discussions?.length )
		{
			console.log('A new discussion was created')
			for (let d of new_discussions) {
				discussions = [...discussions, d]
				all_messages[d.discussionId - 1] = []
			}
		}
		if ( new_messages?.length )
		{
			console.log('Got a new message !', new_messages)
			for (let msg of new_messages)
			{
				let i = msg.discussionId - 1
				all_messages[i] = [ ...all_messages[i], msg]
			}
		}
	}

</script>

{#if discussions.length }
    <DiscussionList { discussions } bind:curr_disc_idx={idx} />
	<br>
	<br>
	<CreateDiscussion />
	<h2>
		{ discussions[idx].title || discussions[idx].users }
	</h2>
	<DiscussionDisplay bind:displayed_messages={ all_messages[idx] } discussionId={ idx + 1 } my_name={ data.my_name }/>
{:else}
	<p>You haven't started any conversations yet</p>
	<CreateDiscussion />
{/if}
