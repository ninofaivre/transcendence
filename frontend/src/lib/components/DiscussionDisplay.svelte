<script lang="ts">
	// DiscussionDisplay.svelte

	import type { Chan, DirectConversation, GameSocket, MessageOrEvent } from "$types"
	import type { Writable } from "svelte/store"

	import ChatBubble from "$components/ChatBubble.svelte"
	import { getContext, onMount } from "svelte"
	import { createEventDispatcher } from "svelte"

	console.log("DiscussionDisplay init")

	export let discussion: Chan | DirectConversation | undefined
	export let messages: MessageOrEvent[] = []
	export let sendLoadEvents: boolean
	export let my_name: string

	let observer: IntersectionObserver
	const reactivity = 1000
	const loading_greediness = 20
	let canary: HTMLDivElement
	let _init: boolean = true
	const dispatch = createEventDispatcher()
	let game_socket: Writable<GameSocket> = getContext("game_socket")

	async function intersectionHandler([entry, ..._]: IntersectionObserverEntry[]) {
		if (_init) return
		if (sendLoadEvents) {
			// console.log("intersectionHandler has been called")
			const oldest_message = canary?.nextElementSibling
			const cursor = oldest_message?.getAttribute("id")
			if (cursor && entry.isIntersecting) {
				dispatch("loadprevious", { loading_greediness, cursor, canary })
			}
		}
	}

	let conversation_container: HTMLDivElement

	onMount(() => {
		console.log("Mounting DiscussionDisplay")
		//Set up observer
		observer = new IntersectionObserver(intersectionHandler, {
			rootMargin: `${reactivity}px`,
		})
		observer.observe(canary)

		_init = false

		return () => {
			observer.unobserve(canary)
		}
	})

	function msToCoolDown(timeout: number) {
		let total = 0

		const oneDayMs = 1000 * 60 * 60 * 24
		const oneHourMs = 1000 * 60 * 60
		const oneMinuteMs = 1000 * 60

		const days = Math.floor(timeout / oneDayMs)
		total += days * oneDayMs
		const hours = Math.floor((timeout - total) / oneHourMs)
		total += hours * oneHourMs
		const minutes = Math.floor((timeout - total) / oneMinuteMs)
		total += minutes * oneMinuteMs
		const seconds = Math.floor((timeout - total) / 1000)
		total += seconds * 1000

		const daysString = days ? `${days}d` : ""
		total -= days * oneDayMs
		let hoursString = daysString.length && total ? ":" : ""
		hoursString += hours ? `${hours < 10 ? `0${hours}` : hours}h` : days && total ? "00h" : ""
		total -= hours * oneHourMs
		let minutesString = hoursString.length && total ? ":" : ""
		minutesString += minutes
			? `${minutes < 10 ? `0${minutes}` : minutes}m`
			: hours && total
			? "00m"
			: ""
		total -= minutes * oneMinuteMs
		let secondsString = minutesString.length && total ? ":" : ""
		secondsString += seconds ? `${seconds < 10 ? `0${seconds}` : seconds}s` : ""
		const res = `${daysString}${hoursString}${minutesString}${secondsString}`
		return res.length ? res : `${timeout}ms`
	}
</script>

<div bind:this={conversation_container} class="flex flex-col-reverse space-y-4 overflow-y-auto p-4">
	<div class="flex flex-col scroll-smooth">
		<div bind:this={canary} id="canary" class="min-h-[1px]" />
		{#if discussion}
			<div class="relative">
				<div class="absolute bottom-1/2 left-1/2 text-red-600">
					{discussion.id}
				</div>
			</div>
			{#each messages as message (message.creationDate)}
				{#if message.type === "message"}
					<ChatBubble
						{discussion}
						{message}
						from_me={message.author === my_name}
						on:delete
						on:edit
						{game_socket}
						{my_name}
					/>
				{:else if message.type === "event"}
					<div id={message.id}>
						{#if message.eventType == "CREATED_FRIENDSHIP"}
							<div class="text-center text-gray-500">
								You are now friend with
								<a
									href={`/users/${message.otherName}`}
									class="variant-soft btn btn-sm"
								>
									<span class="text-gray-500">
										{message.otherDisplayName}
									</span>
								</a>
							</div>
						{:else if message.eventType == "BLOCKED"}
							<div class="text-center text-gray-500">
								<a
									href={`/users/${message.blockingUserName}`}
									class="variant-soft btn btn-sm"
								>
									<span class="text-gray-500">
										{message.blockingDisplayName}
									</span>
								</a>
								blocked
								<a
									href={`/users/${message.blockedUserName}`}
									class="variant-soft btn btn-sm"
								>
									<span class="text-gray-500">
										{message.blockedDisplayName}
									</span>
								</a>
							</div>
						{:else if message.eventType == "AUTHOR_LEAVED"}
							<div class="text-center text-gray-500">
								<a
									href={`/users/${message.author}`}
									class="variant-soft btn btn-sm"
								>
									<span class="text-gray-500">
										{message.authorDisplayName}
									</span>
								</a>
								left the chan
							</div>
						{:else if message.eventType == "AUTHOR_JOINED"}
							<div class="text-center text-gray-500">
								<a
									href={`/users/${message.author}`}
									class="variant-soft btn btn-sm"
								>
									<span class="text-gray-500">
										{message.authorDisplayName}
									</span>
								</a>
								joined the chan
							</div>
						{:else if message.eventType == "CHAN_INVITATION"}
							<div class="text-center text-gray-500"></div>
						{:else if message.eventType == "DELETED_FRIENDSHIP"}
							<div class="text-center text-gray-500">
								{`You are no longer friend with ${message.otherDisplayName}`}
							</div>
						{:else if message.eventType == "AUTHOR_MUTED_CONCERNED"}
							{#if message.timeoutInMs === "infinity"}
								<div class="text-center text-gray-500">
									<a
										href={`/users/${message.author}`}
										class="variant-soft btn btn-sm"
									>
										<span class="text-gray-500">
											{message.authorDisplayName}
										</span>
									</a>
									muted
									<a
										href={`/users/${message.concernedUserName}`}
										class="variant-soft btn btn-sm"
									>
										<span class="text-gray-500">
											{message.concernedDisplayName}
										</span>
									</a>
									until further notice
								</div>
							{:else}
								<div class="text-center text-gray-500">
									<a
										href={`/users/${message.author}`}
										class="variant-soft btn btn-sm"
									>
										<span class="text-gray-500">
											{message.authorDisplayName}
										</span>
									</a>
									muted
									<a
										href={`/users/${message.concernedUserName}`}
										class="variant-soft btn btn-sm"
									>
										<span class="text-gray-500">
											{message.concernedDisplayName}
										</span>
									</a>
									for {msToCoolDown(message.timeoutInMs)}
								</div>
							{/if}
						{:else if message.eventType == "AUTHOR_KICKED_CONCERNED"}
							<div class="text-center text-gray-500">
								<a
									href={`/users/${message.author}`}
									class="variant-soft btn btn-sm"
								>
									<span class="text-gray-500">
										{message.authorDisplayName}
									</span>
								</a>
								kicked
								<!-- TODO s'assurer que concernedUserName et displayName ne soit pas nul du côté du back / contract -->
								<a
									href={`/users/${message.concernedUserName}`}
									class="variant-soft btn btn-sm"
								>
									<span class="text-gray-500">
										{message.concernedDisplayName}
									</span>
								</a>
							</div>
						{:else}
							<div class="text-center text-gray-500"></div>
						{/if}
					</div>
				{/if}
			{/each}
		{:else}
			{discussion}
		{/if}
	</div>
</div>
