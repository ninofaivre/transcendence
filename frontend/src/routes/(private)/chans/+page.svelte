<script lang="ts">
	import { goto, invalidate } from "$app/navigation"
	import { page } from "$app/stores"
	import type { PageData } from "./$types"

	export let data: PageData

	;(async () => await invalidate(":chans"))()
    console.log(data.chanList)
	if (data.chanList[0]) {
		goto($page.url + "/" + $page.data.chanList[0].id)
	}
</script>
