<script lang="ts">
	import type { GameSocket } from "$types"
	import type { ModalSettings } from "@skeletonlabs/skeleton"

	// import { game_socket } from "$lib/global"
	import { PUBLIC_BACKEND_URL } from "$env/static/public"
	import { io } from "socket.io-client"
	import { onDestroy, setContext } from "svelte"
	import { modalStore } from "@skeletonlabs/skeleton"

	let game_socket: GameSocket = io(PUBLIC_BACKEND_URL, {
		withCredentials: true,
	})

	game_socket.on("disconnect", (data) => {
		console.log(data)
		game_socket = io(PUBLIC_BACKEND_URL, {
			withCredentials: true,
		})
	})
	console.log("init game socket", game_socket)

	setContext("game_socket", game_socket)

	onDestroy(() => {
		game_socket.close()
	})

	game_socket.on("invited", async (invitation, callback) => {
		console.log("Am being invited!")
		const r = await new Promise<"accepted" | "refused" | undefined>((resolve) => {
			const modal: ModalSettings = {
				type: "component",
				component: "AcceptGameInvitationModal",
				response: (r) => {
					modalStore.close()
					resolve(r)
				},
				meta: {
					username: invitation.username,
				},
			}
			modalStore.trigger(modal)
		})
		if (r) callback(r)
	})
</script>

<slot />
