<script lang="ts">
	import { getModalStore } from "@skeletonlabs/skeleton"
	import { zChanPassword } from "contract"
	import { onMount } from "svelte"

	const modalStore = getModalStore()

	function onPromptSubmit() {
		if ($modalStore[0]?.response) {
			$modalStore[0].response(first_input === "" ? null : first_input)
		}
	}

	function onClose() {
		if ($modalStore[0]?.response) {
			$modalStore[0].response(undefined)
		}
	}

	let first_input: string = ""
	let second_input: string = ""

	let disabled: boolean = false
	$: not_same = first_input !== second_input
	$: {
		if (not_same) disabled = true
		else disabled = false
	}
</script>

<form class="card space-y-4 p-4" on:submit={onPromptSubmit}>
	<header class="modal-header px-2">
		To remove the password entirely, leave both fields empty
	</header>
	<label for="first" class="label"> Password </label>
	<input
		bind:value={first_input}
		type="text"
		class="input"
		on:keyup={() => {}}
		id="first"
		minlength={zChanPassword.minLength}
		maxlength={zChanPassword.maxLength}
	/>
	<label for="second" class="label"> Confirm password </label>
	<input
		bind:value={second_input}
		type="text"
		class="input"
		on:keyup={() => {}}
		id="second"
		minlength={zChanPassword.minLength}
		maxlength={zChanPassword.maxLength}
	/>
	<sub class="text-red-500">
		{#if not_same}
			Passwords are different
		{/if}
	</sub>
	<footer class="modal-footer flex">
		<button type="button" class="variant-ghost-surface btn flex-1" on:click={onClose}
			>Cancel</button
		>
		<div class="flex-1"></div>
		<button {disabled} type="submit" class="variant-filled btn flex-1 justify-self-end">
			{first_input ? "Confirm password change" : "Confirm password removal"}
		</button>
	</footer>
</form>

<style>
</style>
