<script lang="ts">

	import DiscussionList from './DiscussionList.svelte'
	import DiscussionDisplay from './DiscussionDisplay.svelte'
	import ChatBox from './ChatBox.svelte'
	//import { writable } from 'svelte/store'
	import type { Discussion as DiscussionType } from '$types'

	export let discussions: DiscussionType[] = 
	[
		{ id: 0, name: "Discussion 1", users: ["alice", "bob"], messages: ['Hi alice!', 'Hi bob!'] },
		{ id: 1, users: ["bob", "charlotte"], messages: ['Hi bob!', 'Hello charlotte'] },
		{ id: 2, name: "Discussion 3", users: ["alice", "charlotte"], messages: ['hi alice','hi charlotte'] },
	]

	let idx = 0

</script>

<h1>
	CHAT
</h1>

<DiscussionList { discussions } bind:curr_disc_idx={idx} />
<DiscussionDisplay discussion={ discussions[idx] } />
<ChatBox bind:messages={ discussions[idx].messages }/>
