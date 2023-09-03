<script lang="ts">
	// Most of your app wide CSS should be put in this file
	import "../app.postcss"
	import { getToastStore, initializeStores } from "@skeletonlabs/skeleton"

	import { AppShell, AppBar, LightSwitch, Toast, Avatar } from "@skeletonlabs/skeleton"
	import { makeToast } from "$lib/global"
	import { logged_in } from "$lib/stores"
	import { onMount } from "svelte"
	import { goto } from "$app/navigation"
	import {
		getModalStore,
		Modal,
		type ModalComponent,
		type ModalSettings,
	} from "@skeletonlabs/skeleton"
	import { PUBLIC_BACKEND_URL } from "$env/static/public"
	import { page } from "$app/stores"
	import { client } from "$clients"

	// Modals
	import TimeChooser from "$lib/TimeChooser.svelte"
	import InviteFriendToChan from "$lib/InviteFriendToChan.svelte"
	import CreateRoom from "$lib/CreateRoom.svelte"
	import WaitForGame from "$lib/WaitForGame.svelte"
	import SendFriendRequestModal from "$lib/SendFriendRequestModal.svelte"
	import AcceptGameInvitationModal from "$lib/AcceptGameInvitationModal.svelte"
	import TwoFAModal from "$lib/TwoFAModal.svelte"
	import JoinRoom from "$lib/JoinRoom.svelte"

	initializeStores()
	const modalStore = getModalStore()
	const toastStore = getToastStore()

	$: {
		// Prevents redir coming back from 42, or losing the query string for /auth
		if (!$page.url.pathname.match(/\bauth\b/)) {
			if ($logged_in == false) {
				goto("/auth" + $page.url.searchParams.toString())
			}
		}
	}

	const modalComponentRegistry: Record<string, ModalComponent> = {
		TimeChooser: { ref: TimeChooser },
		InviteFriendToChan: { ref: InviteFriendToChan },
		CreateRoom: { ref: CreateRoom },
		JoinRoom: { ref: JoinRoom },
		WaitForGame: { ref: WaitForGame },
		SendFriendRequestModal: { ref: SendFriendRequestModal },
		AcceptGameInvitationModal: { ref: AcceptGameInvitationModal },
		TwoFAModal: { ref: TwoFAModal },
	}

	onMount(() => console.log("Layout mounted"))

	const menuItems = [
		{ inner: "🏓", href: "/pong" },
		{ inner: "💬", href: "/chans" },
		{ inner: "✉️", href: "/dms" },
		{ inner: "🤝", href: "/friends" },
	]

	async function logout() {
		return client.auth
			.logout()
			.catch(({ status, message }) => {
				makeToast(
					`Can't log out. Server returned ${status} ${
						message ? "without a message" : `${message}`
					}`,
					toastStore,
				)
			})
			.then(() => {
				makeToast("Logging out...", toastStore)
			})
			.finally(() => {
				logged_in.set(false)
			})
	}
</script>

<!-- App Shell -->
<Modal components={modalComponentRegistry} />
<Toast />
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
						class="variant-filled-success btn btn-sm mx-4 mb-1 text-2xl font-semibold"
						href={menuItem.href}
					>
						{menuItem.inner}
					</a>
				{/each}
			{/if}
			<svelte:fragment slot="trail">
				{#if $logged_in && $page.data.me?.userName}
					<button
						on:click={() => logout()}
						class="variant-filled-secondary btn btn-sm mr-1 text-xs font-semibold"
					>
						Log out
					</button>
					<a href="/myprofile" class="variant-ghost chip ml-1 flex">
						<Avatar
							src="{PUBLIC_BACKEND_URL}/api/users/{$page.data.me.userName}/profilePicture"
							fallback="https://i.pravatar.cc/?u={$page.data.me.userName}"
							class="h-8 w-8"
							rounded="rounded-full"
						/>
						<div>
							{$page.data.me.userName}
						</div>
					</a>
				{/if}
				<LightSwitch />
			</svelte:fragment>
		</AppBar>
	</svelte:fragment>
	<!-- Page Route Content -->
	<slot />
</AppShell>
