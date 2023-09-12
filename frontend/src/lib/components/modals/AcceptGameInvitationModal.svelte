<script lang="ts">
	import { ProgressRadial, getModalStore } from "@skeletonlabs/skeleton"
	import { timeReplyToInvitation } from "contract"

	const modalStore = getModalStore()
	const username = $modalStore[0].meta.username

	let value = timeReplyToInvitation
	for (let i = timeReplyToInvitation / 1000; i > 0; i--) {
		setTimeout(() => {
			value -= 1000
		}, 1000 * i)
	}

	function onDeny() {
		if ($modalStore[0]?.response) {
			$modalStore[0].response("refused")
		}
	}

	function onAccept() {
		if ($modalStore[0]?.response) {
			$modalStore[0].response("accepted")
		}
	}

	$: {
		if (value <= 0 && $modalStore[0]?.response) {
			$modalStore[0].response(undefined)
		}
	}
</script>

<div class="card grid grid-rows-3 p-8">
	<p>{username} invited you to a game of Pong!</p>
	<div class="self-center justify-self-center">
		<ProgressRadial value={(value * 100) / timeReplyToInvitation} width="w-16">
			{value / 1000}
		</ProgressRadial>
	</div>
	<button
		on:click={onDeny}
		class="variant-ghost-error btn btn-sm mt-4 h-fit w-fit self-center justify-self-center"
	>
		Deny
	</button>
	<button
		on:click={onAccept}
		class="variant-ghost-success btn btn-sm mt-4 h-fit w-fit self-center justify-self-center"
	>
		Accept
	</button>
</div>

<style>
	p,
	button {
		font-family: "ArcadeClassic", monospace;
		/* font-family: "ArcadeClassic", monospace, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; */
	}
</style>
