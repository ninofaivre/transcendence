<script lang="ts">

	import type Discussion from '$types'

	//Add type

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

{#each discussion.messages as message}
	<div>{ message }</div>
{/each}

<style>
</style>
