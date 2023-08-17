<script lang="ts">
	import type { PageData } from "./$types"
	import { PUBLIC_BACKEND_URL } from "$env/static/public"
	import { Avatar } from "@skeletonlabs/skeleton"

	export let data: PageData
</script>

<div class="mt-28 sm:mx-auto sm:w-full sm:max-w-md">
	<div class="rounded-lg bg-gray-50 p-8 sm:px-10">
		<div class="grid grid-cols-2">
			<Avatar
				src="{PUBLIC_BACKEND_URL}/users/{data.username}/profilePicture"
				fallback="https://i.pravatar.cc/?u={data.username}"
				alt="profile"
			/>
			<h1 class="self-center text-black">{data.username}</h1>
		</div>
	</div>
</div>
