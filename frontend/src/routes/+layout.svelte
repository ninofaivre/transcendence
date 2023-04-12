<script lang="ts">
	// The ordering of these imports is critical to your app working properly
	import "@skeletonlabs/skeleton/themes/theme-seafoam.css"
	// If you have source.organizeImports set to true in VSCode, then it will auto change this ordering
	import "@skeletonlabs/skeleton/styles/all.css"
	// Most of your app wide CSS should be put in this file
	import "../app.postcss"

	import type { BeforeNavigate } from "@sveltejs/kit"

	import { AppShell, AppBar, LightSwitch, Toast } from "@skeletonlabs/skeleton"
	import { logout, getCookie } from "$lib/global"
	import { logged_in, my_name } from "$lib/stores"
	import { onDestroy, onMount } from "svelte"
	import { beforeNavigate, goto } from "$app/navigation"

	function setup_logout(node: HTMLButtonElement) {
		node.addEventListener("click", () => logout())
	}

	// For all pages, check if user is logged in else redirect to the home/auth page... hopefully
	function authGuard({ cancel, willUnload }: BeforeNavigate) {
		console.log("Checking credentials...")
		if (!getCookie("access_token")) {
			console.log("You are NOT logged_in")
			willUnload = false
			cancel()
			return
		}
		console.log("You are logged_in")
	}

	beforeNavigate(authGuard)

	onMount(() => console.log("Layout mounted"))
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
			<a class="btn text-lg font-semibold" href="/chat"> Chat </a>
			<a class="btn text-lg font-semibold" href="/pong"> Pong </a>
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
