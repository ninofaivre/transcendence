<script lang="ts">
	// The ordering of these imports is critical to your app working properly
	import "@skeletonlabs/skeleton/themes/theme-seafoam.css"
	// If you have source.organizeImports set to true in VSCode, then it will auto change this ordering
	import "@skeletonlabs/skeleton/styles/all.css"
	// Most of your app wide CSS should be put in this file
	import "../app.postcss"

	import { AppShell, AppBar, LightSwitch, Toast } from "@skeletonlabs/skeleton"
	import { logout, getCookie } from "$lib/global"
	import { logged_in, my_name } from "$lib/stores"

	function setup_logout(node: HTMLButtonElement) {
		node.addEventListener("click", () => logout())
	}

	// The first time check if our cookie is still here
	if (getCookie("access_token")) logged_in.set(true)

	$: console.log($logged_in)

	// For all pages, check if user is logged in else redirect to the home/auth page... hopefully
	$: {
		if ($logged_in === false) {
			console.log("You are not logged_in")
			if (window.location.pathname !== "/") {
				window.location.pathname = "/"
			}
		}
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
			<a class="btn text-lg font-semibold" href="/chat" target="_self"> Chat </a>
			<a class="btn text-lg font-semibold" href="/pong" target="_self"> Pong </a>
			<svelte:fragment slot="trail">
				{#if $logged_in}
					<button
						use:setup_logout
						class="btn variant-filled-secondary text-xs font-semibold"
					>
						Log out
					</button>
					<div class="card">
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
