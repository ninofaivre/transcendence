<script lang="ts">
	import { goto } from "$app/navigation"
	import { page } from "$app/stores"

    if ($page.data.dmList[0])
        goto($page.url + "/" + $page.data.dmList[0].id)
</script>
