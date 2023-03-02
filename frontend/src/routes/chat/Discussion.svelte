<script lang="ts">

	export let discussion = {
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
	{discussion.name}
</h2>

{#each discussion.messages as message}
	<div>{ message }</div>
{/each}

<style>
</style>
