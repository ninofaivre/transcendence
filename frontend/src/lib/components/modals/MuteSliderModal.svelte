<script lang="ts">
	import { RangeSlider, getModalStore } from "@skeletonlabs/skeleton"

	const modalStore = getModalStore()
	// 1 s -- 1000 ms
	// 60 s -- 1 mn
	// 60 min -- 1h
	// 24 h -- 1d

	/*           1s    1mn   30mn*/
	let value = 1000 * 60 * 30
	let step = value
	/*           1s  1mn  1h   1d  1w  */
	let max = 1000 * 60 * 60 * 24 * 7

	function msToDaysHoursMinutes(ms: number) {
		const seconds = Math.floor(ms / 1000)
		const minutes = Math.floor(seconds / 60)
		const hours = Math.floor(minutes / 60)
		const days = Math.floor(hours / 24)

		const daysRemainder = days
		const hoursRemainder = hours % 24
		const minutesRemainder = minutes % 60
		const secondsRemainder = seconds % 60

		return `${daysRemainder} days, ${hoursRemainder} hours, ${minutesRemainder} minutes, ${secondsRemainder} seconds`
	}

	function onPromptSubmit() {
		if ($modalStore[0]?.response) {
			$modalStore[0].response(value)
		}
	}

	function onClose() {
		if ($modalStore[0]?.response) {
			$modalStore[0].response(undefined)
		}
	}
</script>

<form class="space-y-4" on:submit={onPromptSubmit}>
	<RangeSlider name="range-slider" bind:value {max} {step}>
		<div class="flex items-center justify-between">
			<div class="font-bold">Duration</div>
			<div class="text-xs">{msToDaysHoursMinutes(value)}</div>
		</div>
	</RangeSlider>
	<footer class="modal-footer">
		<button type="button" class="variant-ghost-surface btn" on:click={onClose}>Cancel</button>
		<button type="submit" class="variant-filled btn">Mute</button>
	</footer>
</form>

<style>
</style>
