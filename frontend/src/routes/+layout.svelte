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

	if ($logged_in == true) {
		console.log("We found our cookie. You are now logged in")
	}

	// The check to set the store to true is done is the layout load function
	// but the redirection needs to happen when the component is initialized
	$: {
		if ($logged_in == false) {
			console.log("You are NOT logged in, redirecting to home page...")
			goto("/")
		}
	}

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
			{#if $logged_in}
				<a class="btn text-lg font-semibold" href="/chat"> Chat </a>
				<a class="btn text-lg font-semibold" href="/pong"> Pong </a>
			{/if}
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
