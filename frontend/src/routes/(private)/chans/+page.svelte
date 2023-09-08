<script lang="ts">
	import { goto } from "$app/navigation"
	import { page } from "$app/stores"
	import type { PageData } from "./$types"

	export let data: PageData

    console.log(data.chanList)
	if (data.chanList[0]) {
		goto($page.url + "/" + $page.data.chanList[0].id)
	}
</script>
