<script lang="ts">
	// The ordering of these imports is critical to your app working properly
	import "@skeletonlabs/skeleton/themes/theme-skeleton.css"
	// If you have source.organizeImports set to true in VSCode, then it will auto change this ordering
	import "@skeletonlabs/skeleton/styles/skeleton.css"
	// Most of your app wide CSS should be put in this file
	import "../app.postcss"

	import { AppShell, AppBar, LightSwitch, Toast, Avatar } from "@skeletonlabs/skeleton"
	import { bs_hash, logout } from "$lib/global"
	import { logged_in, my_name } from "$lib/stores"
	import { onMount } from "svelte"
	import { goto } from "$app/navigation"

	function setup_logout(node: HTMLButtonElement) {
		node.addEventListener("click", () => logout())
	}

	$: {
		if ($logged_in == true) {
			goto("/dms")
		} else if ($logged_in == false) {
			goto("/auth")
		}
		// if ($logged_in == false) {
		// 	goto("/auth")
		// }
	}

	onMount(() => console.log("Layout mounted"))

	const menuItems = [
		{ inner: "🏓", href: "/pong" },
		{ inner: "💬", href: "/chat" },
		{ inner: "✉️", href: "/dms" },
		{ inner: "🤝", href: "/friends" },
	]
</script>

<!-- App Shell -->
<AppShell regionPage="w-full">
	<svelte:fragment slot="header">
		<!-- App Bar -->
		<AppBar
			gridColumns="grid-cols-[auto_1fr_auto]"
			padding="px-2 py-2"
			slotLead=""
			slotDefault="place-self-center grid grid-cols-4"
			slotTrail="place-self-center"
		>
			<svelte:fragment slot="lead">
				<strong
					class="origin-center -rotate-45 py-8 text-xs uppercase md:rotate-0 md:text-lg lg:text-xl xl:text-2xl"
				>
					<a href="/">Transcendance</a>
				</strong>
			</svelte:fragment>
			{#if $logged_in}
				{#each menuItems as menuItem}
					<a
						class="btn btn-sm variant-filled-success mx-4 mb-1 text-2xl font-semibold"
						href={menuItem.href}
					>
						{menuItem.inner}
					</a>
				{/each}
			{/if}
			<svelte:fragment slot="trail">
				{#if $logged_in}
					<button
						use:setup_logout
						class="btn btn-sm variant-filled-secondary mr-1 text-xs font-semibold"
					>
						Log out
					</button>
					<Avatar
						src="https://i.pravatar.cc/?img={bs_hash($my_name)}"
						class="h-8 w-8"
						rounded="rounded-full"
					/>
					<div class="chip variant-ghost ml-1">
						{$my_name}
					</div>
				{/if}
				<LightSwitch />
			</svelte:fragment>
		</AppBar>
	</svelte:fragment>
	<!-- Page Route Content -->
	<slot />
	<Toast />
</AppShell>
