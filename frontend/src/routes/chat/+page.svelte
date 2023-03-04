<script lang="ts">

	import { current_user } from '$lib/stores'
	import DiscussionList from './DiscussionList.svelte'
	import DiscussionDisplay from './DiscussionDisplay.svelte'
	import ChatBox from './ChatBox.svelte'
	//import { writable } from 'svelte/store'
	import type { Discussion as DiscussionType } from '$types'

	let messages_alice_bob = [
		{author: `Alice`, data: `Hi Bob, hi ${ $current_user } !`},
		{author: `Bob`, data: `Hi ${ $current_user }, hi Alice !`},
	]

	let messages_bob_charlotte = [
		{author: 'Bob', data: 'Anyone here ?'},
		{author: $current_user, data: 'Hello Everyone !'},
		{author: 'Charlotte', data: 'Here I am'},
	]

	let messages_alice_and_me = [
		{author: `Charlotte`, data: `Good morning ${ $current_user }`},
		{author: $current_user, data: 'Good morning dear'},
	]

	export let discussions: DiscussionType[] = 
	[
		{ id: 0, name: "Discussion with Bob and Alice", users: ["alice", "bob", $current_user], messages: messages_alice_bob},
		{ id: 1, users: ["Bob", "Charlotte", $current_user], messages: messages_bob_charlotte },
		{ id: 2, name: "Charlotte and I", users: ["alice", $current_user], messages: messages_alice_and_me}
	]

	let idx = 0

</script>

<h1>
	CHAT
</h1>

<DiscussionList { discussions } bind:curr_disc_idx={idx} />
<DiscussionDisplay discussion={ discussions[idx] } />
<ChatBox bind:messages={ discussions[idx].messages }/>
