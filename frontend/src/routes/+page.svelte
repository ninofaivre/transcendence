<script lang="ts">
	import { PUBLIC_FRONT_PAGE } from "$env/static/public"
	import { goto } from "$app/navigation"
	import { logged_in } from "$lib/stores"

	if ($logged_in) goto(PUBLIC_FRONT_PAGE)
</script>
