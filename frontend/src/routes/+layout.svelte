<script lang="ts">
	// The ordering of these imports is critical to your app working properly
	import "@skeletonlabs/skeleton/themes/theme-skeleton.css"
	// If you have source.organizeImports set to true in VSCode, then it will auto change this ordering
	import "@skeletonlabs/skeleton/styles/skeleton.css"
	// Most of your app wide CSS should be put in this file
	import "../app.postcss"

	import { AppShell, AppBar, LightSwitch, Toast, Avatar } from "@skeletonlabs/skeleton"
	import { logout } from "$lib/global"
	import { logged_in, my_name } from "$lib/stores"
	import { onMount } from "svelte"
	import { goto } from "$app/navigation"
	import { Modal, type ModalComponent } from "@skeletonlabs/skeleton"
	import { PUBLIC_BACKEND_URL } from "$env/static/public"
	import { page } from "$app/stores"

	// Modals
	import TimeChooser from "$lib/TimeChooser.svelte"
	import InviteFriendToChan from "$lib/InviteFriendToChan.svelte"
	import CreateRoom from "$lib/CreateRoom.svelte"
	import WaitForGame from "$lib/WaitForGame.svelte"
	import SendFriendRequestModal from "$lib/SendFriendRequestModal.svelte"

	$: {
		// Prevents redir coming back from 42, or losing the query string for /auth
		const pathname =
			$page.url.pathname.slice(-1) === "/"
				? $page.url.pathname.slice(0, -1)
				: $page.url.pathname
		if (
			!(
				pathname.endsWith("/auth") ||
				pathname.endsWith("/signup") ||
				pathname.endsWith("/login")
			)
		) {
			if ($logged_in == false) {
				goto("/auth" + $page.url.searchParams.toString())
			}
		}
	}

	const modalComponentRegistry: Record<string, ModalComponent> = {
		TimeChooser: { ref: TimeChooser },
		InviteFriendToChan: { ref: InviteFriendToChan },
		CreateRoom: { ref: CreateRoom },
		WaitForGame: { ref: WaitForGame },
		SendFriendRequestModal: { ref: SendFriendRequestModal },
	}

	onMount(() => console.log("Layout mounted"))

	const menuItems = [
		{ inner: "🏓", href: "/pong" },
		{ inner: "💬", href: "/chans" },
		{ inner: "✉️", href: "/dms" },
		{ inner: "🤝", href: "/friends" },
	]
</script>

<!-- App Shell -->
<Modal components={modalComponentRegistry} />
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
						on:click={() => logout()}
						class="btn btn-sm variant-filled-secondary mr-1 text-xs font-semibold"
					>
						Log out
					</button>
					<a href="/myprofile" class="chip variant-ghost ml-1 flex">
						<Avatar
							src="{PUBLIC_BACKEND_URL}/api/users/{$my_name}/profilePicture"
							fallback="https://i.pravatar.cc/?u={$my_name}"
							class="h-8 w-8"
							rounded="rounded-full"
						/>
						<div>
							{$my_name}
						</div>
					</a>
				{/if}
				<LightSwitch />
			</svelte:fragment>
		</AppBar>
	</svelte:fragment>
	<!-- Page Route Content -->
	<slot />
	<Toast />
</AppShell>
