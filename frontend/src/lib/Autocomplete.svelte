<script lang="ts">
	import type { AutocompleteOption } from "@skeletonlabs/skeleton"
	import { createEventDispatcher } from "svelte"
	const dispatch = createEventDispatcher()
	export let options: AutocompleteOption[] = []
	export let limit = void 0
	export let allowlist: unknown[] = []
	export let denylist: unknown[] = []
	export let emptyState = "No Results Found."
	export let regionNav = ""
	export let regionList = "list-nav"
	export let regionItem = ""
	export let regionButton = "w-full"
	export let regionEmpty = "text-center"
	// export let duration = 200

	function filterByAllowed(options: AutocompleteOption[]) {
		if (allowlist?.length) {
			return options.filter((option: AutocompleteOption) => {
				return allowlist.includes(option.value)
			})
		} else {
			return [...options] // Expected that a function name filter returns a copy
		}
	}

	function filterByDenied(options: AutocompleteOption[]) {
		if (denylist?.length) {
			const denySet = new Set(denylist)
			return options.filter((option: AutocompleteOption) => !denySet.has(option.value))
		} else {
			return [...options] // Expected that a function name filter returns a copy
		}
	}

	function filterOptions(options: AutocompleteOption[]) {
		if (denylist?.length && allowlist?.length)
			throw new Error("Autocomplete component can't have both an allowlist and denylist")
		else if (denylist?.length) return filterByDenied(options)
		else return filterByAllowed(options)
	}

	function onSelection(option: AutocompleteOption) {
		dispatch("selection", option)
	}

	let optionsFiltered: AutocompleteOption[]
	$: optionsFiltered = filterOptions(options)

	$: sliceLimit = limit ? limit : optionsFiltered.length

	// Styling
	$: classesBase = `${$$props.class ?? ""}`
	$: classesNav = `${regionNav}`
	$: classesList = `${regionList}`
	$: classesItem = `${regionItem}`
	$: classesButton = `${regionButton}`
	$: classesEmpty = `${regionEmpty}`
</script>

<!-- animate:flip={{ duration }} transition:slide|local={{ duration }} -->
<div class="autocomplete {classesBase}">
	{#if optionsFiltered.length > 0}
		<nav class="autocomplete-nav {classesNav}">
			<ul class="autocomplete-list {classesList}">
				{#each optionsFiltered.slice(0, sliceLimit) as option (option)}
					<li class="autocomplete-item {classesItem}">
						<button
							class="autocomplete-button {classesButton}"
							type="button"
							on:click={() => onSelection(option)}
							on:click
							on:keypress
						>
							{@html option.label}
						</button>
					</li>
				{/each}
			</ul>
		</nav>
	{:else}
		<div class="autocomplete-empty {classesEmpty}">{emptyState}</div>
	{/if}
</div>
