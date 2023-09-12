<script lang="ts">
	export let active: boolean = false

	function toggle() {
		active = active ? false : true
	}
</script>

<div class="contents">
	{#if active}
		<slot name="active" {toggle}>
			<p>Placeholder for the default active state</p>
		</slot>
	{:else}
		<slot {toggle}><p>Placeholder for the default passive state</p></slot>
	{/if}
</div>

<style>
</style>
