<script lang="ts">
	import { ProgressRadial, modalStore } from "@skeletonlabs/skeleton"
	import { timeReplyToInvitation } from "contract"

	let value = timeReplyToInvitation
	const username = $modalStore[0].meta.username

	let i = timeReplyToInvitation
	while (i--) {
		setTimeout(() => {
			value -= 1
		}, 1000 * i)
	}

	function onDeny() {
		if ($modalStore[0].response) {
			$modalStore[0].response("refused")
		}
	}

	function onAccept() {
		if ($modalStore[0].response) {
			$modalStore[0].response("accepted")
		}
	}

	$: {
		if (value <= 0 && $modalStore[0].response) {
			$modalStore[0].response(undefined)
		}
	}
</script>

<div class="card grid grid-rows-3 p-8">
	<p>{username} invited you to a game of Pong!</p>
	<div class="self-center justify-self-center">
		<ProgressRadial value={(value * 100) / timeReplyToInvitation} width="w-16">
			{value}
		</ProgressRadial>
	</div>
	<button
		on:click={onDeny}
		class="btn btn-sm variant-ghost-error mt-4 h-fit w-fit self-center justify-self-center"
	>
		Deny
	</button>
	<button
		on:click={onAccept}
		class="btn btn-sm variant-ghost-success mt-4 h-fit w-fit self-center justify-self-center"
	>
		Accept
	</button>
</div>

<style>
	p,
	button {
		font-family: "Press Start 2P", "ArcadeClassic", serif;
	}
</style>
