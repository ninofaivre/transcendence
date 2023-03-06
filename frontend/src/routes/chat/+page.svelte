<script lang="ts">

	/* types */
	import type { Discussion as DiscussionType } from '$types'
	import type { PageData } from './$types';
	
	/* Components */
	import DiscussionList from './DiscussionList.svelte'
	import DiscussionDisplay from './DiscussionDisplay.svelte'
	import ChatBox from './ChatBox.svelte'
	import CreateDiscussion from './CreateDiscussion.svelte'

	/* */
	import { onDestroy } from 'svelte'

	export let data: PageData

	let discussions: DiscussionType[] = data.discussion;

	let idx = 0

	onDestroy(data.unsubscribe);

</script>

<h1>
	CHAT
</h1>

{#if discussions }
	<DiscussionList { discussions } bind:curr_disc_idx={idx} />
	<DiscussionDisplay discussion={ discussions[idx] } />
	<ChatBox bind:messages={ discussions[idx].messages }/>
{:else}
	<p>You haven't started any conversation yet</p>
	<CreateDiscussion/>
{/if}
