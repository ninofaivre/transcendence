<script lang="ts">
	import type { TableSource } from "@skeletonlabs/skeleton"

	import { page } from "$app/stores"
	import { Table } from "@skeletonlabs/skeleton"
	import { tableMapperValues } from "@skeletonlabs/skeleton"
	import type { ClientInferResponseBody } from "@ts-rest/core"
	import type { contract } from "contract"

	type friendType = ClientInferResponseBody<typeof contract.friends.getFriends, 200>[number]

	console.log($page.data.friends)

	const friendTableSource: TableSource = {
		// A list of heading labels.
		head: ["Name", "username"],
		// The data visibly shown in your table body UI.
		body: tableMapperValues($page.data.friends, ["name", "username"]),
		// Optional: The data returned when interactive is enabled and a row is clicked.
		// meta: tableMapperValues($page.data.friends, ["position", "name", "symbol", "weight"]),
		// Optional: A list of footer labels.
		// foot: ["Total", "", '<code class="code">5</code>'],
	}
</script>

<Table source={friendTableSource} />

<style>
</style>
