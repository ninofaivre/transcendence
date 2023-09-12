<script lang="ts">
	import { getModalStore } from "@skeletonlabs/skeleton"
	import { PUBLIC_MODE } from "$env/static/public"

	const modalStore = getModalStore()

	// 1 s -- 1000 ms
	// 60 s -- 1 mn
	// 60 min -- 1h
	// 24 h -- 1d

	function onPromptSubmit() {
		if ($modalStore[0]?.response) {
			$modalStore[0].response(
				seconds * 1000 +
					minutes * 1000 * 60 +
					hours * 1000 * 60 * 60 +
					days * 1000 * 60 * 60 * 24,
			)
		}
	}

	function onClose() {
		if ($modalStore[0]?.response) {
			$modalStore[0].response(undefined)
		}
	}
	const dev_mode = PUBLIC_MODE === "DEV"
	let days: number = 0
	let hours: number = 0
	let minutes: number = 0
	let seconds: number = 0
	const columns = dev_mode ? "grid-cols-4" : "grid-cols-3"
</script>

<form class="card space-y-4" on:submit={onPromptSubmit}>
	<div class="grid {columns} gap-2">
		<div>
			<label for="days" class="label">Days</label>
			<input id="days" bind:value={days} class="input" type="number" min="0" max="23" />
		</div>
		<div>
			<label for="hours" class="label">Hours</label>
			<input id="hours" bind:value={hours} class="input" type="number" min="0" max="23" />
		</div>
		<div>
			<label for="minutes" class="label">Minutes</label>
			<input id="minutes" bind:value={minutes} class="input" type="number" min="0" max="59" />
		</div>
		{#if dev_mode}
			<div>
				<label for="seconds" class="label">Seconds</label>
				<input
					id="seconds"
					bind:value={seconds}
					class="input"
					type="number"
					min="0"
					max="59"
				/>
			</div>
		{/if}
	</div>
	<footer class="modal-footer">
		<button type="button" class="variant-ghost-surface btn" on:click={onClose}>Cancel</button>
		<button type="submit" class="variant-filled btn">Mute</button>
	</footer>
</form>

<style>
</style>
