<script lang="ts">

	import type { Discussion as DiscussionType } from '$types'
	import type { PageData } from './$types';
	
	import DiscussionList from './DiscussionList.svelte'
	import DiscussionDisplay from './DiscussionDisplay.svelte'
	import ChatBox from './ChatBox.svelte'
	import { onDestroy } from 'svelte'

	export let data: PageData

	let discussions: DiscussionType[] = data.discussion;

	let idx = 0

	onDestroy(data.unsubscribe);

</script>

<h1>
	CHAT
</h1>

<DiscussionList { discussions } bind:curr_disc_idx={idx} />
<DiscussionDisplay discussion={ discussions[idx] } />
<ChatBox bind:messages={ discussions[idx].messages }/>
