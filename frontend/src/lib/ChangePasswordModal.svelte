<script lang="ts">
	import { getModalStore } from "@skeletonlabs/skeleton"
	import { onMount } from "svelte"

	const modalStore = getModalStore()

	function onPromptSubmit() {
		if ($modalStore[0].response) {
			$modalStore[0].response(
                null
			)
		}
	}

	function onClose() {
		if ($modalStore[0].response) {
			$modalStore[0].response(undefined)
		}
	}

    let first_input: string = ""
    let second_input: string = ""

    let first_field: HTMLInputElement
    let second_field: HTMLInputElement
    let submit_button: HTMLButtonElement 

    let submitButton = document.querySelector('form > button')

    onMount(() => {
        const fields = [first_field, second_field] // Turn fields into an Array to access the ".every" method.

        fields.forEach(field => {
            field.addEventListener('keyup', () => {
                submit_button.disabled = !fields.every(field => field.value) 
            })
        })
    })

    $: not_same = first_input !== second_input

    let disabled: boolean = false

</script>

<form class="card space-y-4 p-4" on:submit={onPromptSubmit}>
    <input bind:this={first_field} type="text" class="input" on:keyup={() => { }} >
    <input bind:this={second_field} type="text" class="input" on:keyup={() => {}} >
    {#if not_same}
        <sub>
                Passwords are different
        </sub>
    {/if}
	<footer class="modal-footer flex">
		<button type="button" class="variant-ghost-surface btn flex-1" on:click={onClose}>Cancel</button>
        <div class="flex-1"></div>
		<button bind:this={submit_button} {disabled} type="submit" class="variant-filled btn flex-1 justify-self-end">Confirm new password</button>
	</footer>
</form>

<style>
</style>
