<script lang="ts">
	import { ProgressRadial, modalStore } from "@skeletonlabs/skeleton"
	import { timeReplyToInvitation } from "contract"
	import { game_socket } from "./global"

	let value = timeReplyToInvitation
	const username = $modalStore[0].meta.username

	game_socket.on("invite", { username }, (res: "accepted" | "refused" | "badRequest") => {
		if (res === "accepted") {
			element.innerHTML = "<p>Challenge accepted !</p>"
		} else {
			element.innerHTML = "<p>Invitation declined</p>"
			button.innerText = "Close"
		}
	})

	let i = timeReplyToInvitation // seconds
	while (i--) {
		setTimeout(() => {
			value -= 1
		}, 1000 * i)
	}

	function onClose() {
		if ($modalStore[0].response) {
			$modalStore[0].response(undefined)
		}
	}

	$: {
		if (value <= 0) onClose()
	}

	let element: HTMLDivElement
	let button: HTMLButtonElement
</script>

<div class="card grid grid-rows-3 p-8">
	<p class="">Waiting for challenge to be accepted</p>
	<div bind:this={element} class="self-center justify-self-center">
		<ProgressRadial value={(value * 100) / timeReplyToInvitation} width="w-16">
			{value}
		</ProgressRadial>
	</div>
	<button
		bind:this={button}
		on:click={onClose}
		class="btn btn-sm variant-ghost-error mt-4 h-fit w-fit self-center justify-self-center"
		>Cancel</button
	>
</div>

<style>
	p {
		font-family: "Press Start 2P", "ArcadeClassic", serif;
	}
</style>
