<script lang="ts">
	import { Avatar } from "@skeletonlabs/skeleton"

	let messageFeed = [
		{
			id: 0,
			host: true,
			avatar: 42,
			name: "Jane",
			timestamp: "Yesterday @ 2:30pm",
			message: "Hi, how is you plumbing ?",
			color: "variant-soft-primary",
		},
		{
			id: 1,
			host: false,
			avatar: 30,
			name: "Michael",
			timestamp: "Yesterday @ 2:45pm",
			message: "It could use a plumber. Do you know anything about plumbing ?",
			color: "variant-soft-primary",
		},
	]
</script>

<!-- Columns -->
<div class="grid h-full grid-cols-[auto_1fr] gap-1">
	<!-- Rows -->
	<div class="grid grid-rows-[auto_1fr]">
		<div>(search)</div>
		<div>(friends)</div>
	</div>
	<!-- Rows -->
	<div class="grid grid-rows-[1fr_auto]">
		<!-- Feed row-->
		<section>
			<!-- Bubble -->
			{#each messageFeed as bubble}
				<div class="card variant-soft m-2 grid max-w-3xl grid-cols-[auto_1fr] gap-2 p-2">
					<Avatar src="https://i.pravatar.cc/?img={bubble.avatar}" width="w-8" />
					<article>
						<header class="flex justify-between">
							<p class="font-semibold">{bubble.name}</p>
							<small class="opacity-50"> {bubble.timestamp}</small>
						</header>
						<p>
							{bubble.message}
						</p>
					</article>
				</div>
			{/each}
		</section>
		<!-- Input box row-->
		<div>(input_box)</div>
	</div>
</div>

<style>
</style>
