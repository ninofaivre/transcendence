<script lang="ts">
	import { goto } from "$app/navigation"
	import { page } from "$app/stores"
	import type { PageData } from "./$types"

	export let data: PageData

	console.log($page.data.chanList)
	if (data.chanList[0]) {
		// alert("You are on the chan. The first chan id is :" +data.chanList[0].id)
		goto($page.url + "/" + data.chanList[0].id)
	}
</script>
