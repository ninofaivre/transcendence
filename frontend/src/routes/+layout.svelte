<script lang="ts">
	// The ordering of these imports is critical to your app working properly
	import "@skeletonlabs/skeleton/themes/theme-seafoam.css"
	// If you have source.organizeImports set to true in VSCode, then it will auto change this ordering
	import "@skeletonlabs/skeleton/styles/all.css"
	// Most of your app wide CSS should be put in this file
	import "../app.postcss"

	import type { LayoutData } from "./$types"

	import { AppShell, AppBar, LightSwitch, Toast } from "@skeletonlabs/skeleton"
	import { logout } from "$lib/global"
	import { page } from "$app/stores"

	export let data: LayoutData

	function setup_logout(node: HTMLButtonElement) {
		node.addEventListener("click", () => logout())
	}

	function checkLoggedIn() {
		if ($page.data.loggedIn === false) window.location.href = "/"
	}
</script>

<!-- App Shell -->
<AppShell>
	<svelte:fragment slot="header">
		<!-- App Bar -->
		<AppBar slotDefault="place-self-center">
			<svelte:fragment slot="lead">
				<strong class="text-xl uppercase">
					<a href="/">Transcendance</a>
				</strong>
			</svelte:fragment>
			<a class="btn text-lg font-semibold" href="/chat" target="_blank"> Chat </a>
			<a class="btn text-lg font-semibold" href="/pong" target="_blank"> Pong </a>
			<svelte:fragment slot="trail">
				<button use:setup_logout class="btn variant-filled-secondary text-xs font-semibold">
					Log out
				</button>
				<div class="card">{data.myName}</div>
				<LightSwitch />
			</svelte:fragment>
		</AppBar>
	</svelte:fragment>
	<!-- Page Route Content -->
	<slot />
	<Toast />
</AppShell>
