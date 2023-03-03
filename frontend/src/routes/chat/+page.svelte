<script>
	import DiscussionList from './DiscussionList.svelte'
	import DiscussionDisplay from './DiscussionDisplay.svelte'
	//import { writable } from 'svelte/store'
	//import { Discussion as DiscussionType } from '$types'

	// import  { Discussion } from '$types'

	export let discussions = 
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

<textarea>
</textarea>

<style>

	textarea {
		position: fixed;
		bottom: 1%;
	}

</style>


