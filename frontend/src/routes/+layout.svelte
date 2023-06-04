<script lang="ts">
	import "@skeletonlabs/skeleton/themes/theme-skeleton.css"
	// The ordering of these imports is critical to your app working properly
	// If you have source.organizeImports set to true in VSCode, then it will auto change this ordering
	import "@skeletonlabs/skeleton/styles/all.css"
	// Most of your app wide CSS should be put in this file
	import "../app.postcss"

	import { AppShell, AppBar, LightSwitch, Toast } from "@skeletonlabs/skeleton"
	import { logout } from "$lib/global"
	import { logged_in, my_name } from "$lib/stores"
	import { onMount } from "svelte"
	import { goto } from "$app/navigation"
	import { usersClient } from "$lib/clients"

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
				<a class="variant-filled-success btn mx-4 text-2xl font-semibold" href="/pong">
					🏓
				</a>
				<a class="variant-filled-success btn mx-4 text-2xl font-semibold" href="/chat">
					💬
				</a>
				<a class="variant-filled-success btn mx-4 text-2xl font-semibold" href="/dms">
					✉️
				</a>
			{/if}
			<svelte:fragment slot="trail">
				{#if $logged_in}
					<button
						use:setup_logout
						class="btn variant-filled-secondary text-xs font-semibold"
					>
						Log out
					</button>
					<div class="chip variant-ghost">
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
