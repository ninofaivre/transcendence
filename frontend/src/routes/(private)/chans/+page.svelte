<script lang="ts">
	import { goto } from "$app/navigation"
	import { page } from "$app/stores"
	import type { LayoutData, PageData } from "../../$types"

    export let data: LayoutData

	goto($page.url + "/" + data.chanList[0]?.id)
</script>
