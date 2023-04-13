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
	function authGuard({ cancel, willUnload, to }: BeforeNavigate) {
		console.log("Checking credentials...")
		console.log(to?.route.id)
		console.log(getCookie("access_token"))
		if (!getCookie("access_token")) {
			if (to?.route.id !== "/") {
				console.log(
					"You are NOT logged_in an trying to go somewhere else. I will prevent navigation",
				)
				willUnload = false
				cancel()
			} else console.log("You are NOT logged_in but since you are going home, go")
		} else {
			willUnload = true
			console.log("You are logged_in. I will not prevent navigation")
		}
	}
	beforeNavigate(authGuard)

	if (getCookie("access_token")) {
		logged_in.set(true)
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

	// const localStore = localStorage.setItem

	// localStorage.setItem = function (key, value) {
	// 	const event = new Event("localUpdated")

	// 	document.dispatchEvent(event)
	// 	localStore.apply(this, arguments)
	// }

	// const localStoreHandler = function (e) {
	// 	console.log(`👉 localStorage.set('${e.key}', '${e.value}') updated`)
	// }

	// document.addEventListener("localUpdated", localStoreHandler, false)

	// localStorage.setItem("username", "amoos")

	// // After 2 second
	// setTimeout(() => localStorage.setItem("username", "rifat"), 2000)
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
