<script lang="ts">
	// Most of your app wide CSS should be put in this file
	import "../app.postcss"
	import { getToastStore, initializeStores } from "@skeletonlabs/skeleton"

	import { AppShell, AppBar, LightSwitch, Toast } from "@skeletonlabs/skeleton"
	import { logged_in } from "$lib/stores"
	import { goto } from "$app/navigation"
	import { Modal, type ModalComponent } from "@skeletonlabs/skeleton"
	import { PUBLIC_BACKEND_URL, PUBLIC_MODE } from "$env/static/public"
	import { page } from "$app/stores"
	import { client } from "$clients"
	import { isContractError } from "contract"

	// Components
	import ProfilePicture from "$components/ProfilePicture.svelte"

	// Modals
	import TimeChooserModal from "$modals/TimeChooserModal.svelte"
	import InviteFriendToChanModal from "$modals/InviteFriendToChanModal.svelte"
	import CreateRoomModal from "$modals/CreateRoomModal.svelte"
	import WaitForGameModal from "$modals/WaitForGameModal.svelte"
	import SendFriendRequestModal from "$modals/SendFriendRequestModal.svelte"
	import AcceptGameInvitationModal from "$modals/AcceptGameInvitationModal.svelte"
	import TwoFAModal from "$modals/TwoFAModal.svelte"
	import JoinRoomModal from "$modals/JoinRoomModal.svelte"
	import CropperModal from "$modals/CropperModal.svelte"
	import ChangePasswordModal from "$modals/ChangePasswordModal.svelte"

	initializeStores()
	const toastStore = getToastStore()
	;(window as any).makeToast = function (message: string) {
		toastStore.trigger({
			message,
		})
	}
	;(window as any).checkError = function (ret: { status: number; body: any }, what: string) {
		if (isContractError(ret)) {
            if (PUBLIC_MODE.toLowerCase() === "dev")
			    (window as any).makeToast("Could not " + what + " : " + ret.body.message)
            else
			    (window as any).makeToast("Could not " + what)
			console.log(ret.body.code)
		} else {
			if (PUBLIC_MODE.toLowerCase() === "dev") {
				let msg = "Server return unexpected status " + ret.status
				if ("message" in ret.body) msg += " with message " + ret.body.message
				;(window as any).makeToast(msg, toastStore)
				console.error(msg)
			} else (window as any).makeToast("Unexpected error. Please refresh the page")
		}
	}
	const checkError: (ret: { status: number; body: any }, what: string) => void = (window as any)
		.checkError
	const makeToast: (message: string) => void = (window as any).makeToast

	const modalComponentRegistry: Record<string, ModalComponent> = {
		TimeChooserModal: { ref: TimeChooserModal },
		InviteFriendToChanModal: { ref: InviteFriendToChanModal },
		CreateRoomModal: { ref: CreateRoomModal },
		JoinRoomModal: { ref: JoinRoomModal },
		WaitForGameModal: { ref: WaitForGameModal },
		SendFriendRequestModal: { ref: SendFriendRequestModal },
		AcceptGameInvitationModal: { ref: AcceptGameInvitationModal },
		TwoFAModal: { ref: TwoFAModal },
		ChangePasswordModal: { ref: ChangePasswordModal },
		CropperModal: { ref: CropperModal },
	}

	const menuItems = [
		{ inner: "🏓", href: "/pong" },
		{ inner: "💬", href: "/chans" },
		{ inner: "✉️", href: "/dms" },
		{ inner: "🤝", href: "/friends" },
	]

	async function logout() {
		const ret = await client.auth.logout()
		if (ret.status !== 200) {
			checkError(ret, "log")
		} else {
			makeToast("Logging out...")
			logged_in.set(false)
		}
		// TODO
		logged_in.set(false)
	}

	$: {
		// Prevents redir coming back from 42 api, or losing the query string for /auth
		if (!$page.url.pathname.match(/\bauth\b/)) {
			if ($logged_in === false) {
				goto("/auth" + $page.url.searchParams.toString())
			}
		}
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
					<a
						href="/"
						class="tracking-wide"
						style:font-family="ArcadeClassic"
						style:font-size="1.5rem"
					>
						TRANSCENDENCE
					</a>
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
						<ProfilePicture
							src="{PUBLIC_BACKEND_URL}/api/users/{$page.data.me
								.userName}/profilePicture?id={$page.data.me.userName}"
							fallback="https://i.pravatar.cc/?u={$page.data.me.userName}"
							class="h-8 w-8"
						/>
						<div>
							{$page.data.me.displayName}
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

<style>
	a::first-letter {
		initial-letter: 2;
	}
</style>
