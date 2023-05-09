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
	import { setContext, getContext, hasContext, onMount } from "svelte"
	import { goto } from "$app/navigation"

	function setup_logout(node: HTMLButtonElement) {
		node.addEventListener("click", () => logout())
	}

	$: {
		if ($logged_in == true) {
			console.log("We found our cookie. You are now logged in. Creating an event source...")
			setContext("eventSource", new EventSource("/api/sse"))
			goto("/chat")
		} else if ($logged_in == false) {
			console.log("You are NOT logged in, redirecting to auth page...")
			// Does the sse_store loose all subscribers ?
			if (hasContext("eventSource")) {
				console.log("Closing event source")
				getContext<EventSource>("eventSource").close()
				console.log(
					"Is event source closed ?:",
					getContext<EventSource>("eventSource").readyState == 2 ? "Yes" : "No",
				)
			}
			goto("/auth")
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
				<a class="btn variant-filled-success mx-4 text-2xl font-semibold" href="/pong">
					🏓
				</a>
				<a class="btn variant-filled-success mx-4 text-2xl font-semibold" href="/chat">
					💬
				</a>
				<a class="btn variant-filled-success mx-4 text-2xl font-semibold" href="/dms">
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
