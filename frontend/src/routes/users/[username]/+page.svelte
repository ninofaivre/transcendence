<script lang="ts">
	import type { PageData } from "./$types"
	import { PUBLIC_BACKEND_URL } from "$env/static/public"
	import { page } from "$app/stores"

	export let data: PageData
</script>

<h1>{$page.params.username}</h1>
<img src="{PUBLIC_BACKEND_URL}/users/{$page.params.username}/profilePicture" alt="profile" />

<h1>{data.username}</h1>
<img src="{PUBLIC_BACKEND_URL}/users/{data.username}/profilePicture" alt="profile" />
