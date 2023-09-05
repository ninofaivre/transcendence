<script lang="ts">
	import { goto } from "$app/navigation"
	import { page } from "$app/stores"
	import type { LayoutData, PageData } from "../../$types"

    if ($page.data.chanList[0])
        goto($page.url + "/" + $page.data.chanList[0].id)
</script>
