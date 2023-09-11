import type { SseEvent } from "contract"

import { isContractError } from "contract"
import type { getToastStore } from "@skeletonlabs/skeleton"

export function makeToast(message: string, toastStore?: ReturnType<typeof getToastStore>) {
	if (toastStore)
		toastStore.trigger({
			message,
		})
	else alert(message)
	return message
}

export function checkError(
	ret: { status: number; body: any },
	what: string,
	toastStore?: ReturnType<typeof getToastStore>,
) {
	if (isContractError(ret)) {
		makeToast("Could not " + what + " : " + ret.body.message, toastStore)
		console.log(ret.body.code)
	} else {
		let msg = "Server return unexpected status " + ret.status
		if ("message" in ret.body) msg += " with message " + ret.body.message
		makeToast(msg, toastStore)
		console.error(msg)
	}
}

type GetDataFromEventType<T extends SseEvent["type"]> = Extract<SseEvent, { type: T }>["data"]

export function addListenerToEventSource<EventType extends SseEvent["type"]>(
	es: EventSource,
	eventType: EventType,
	callback: (data: GetDataFromEventType<EventType>, event: MessageEvent) => void,
) {
	const call_callback_on_event_data = (ev: MessageEvent) => {
		callback(JSON.parse(ev.data), ev)
	}
	es.addEventListener(eventType, call_callback_on_event_data)
	return () => void es.removeEventListener(eventType, call_callback_on_event_data)
}

import type { ActionReturn } from "svelte/action"
// use: function
export function listenOutsideClick(
	node: HTMLElement,
): ActionReturn<{}, { "on:outsideclick": (e: CustomEvent<void>) => void }> {
	// So we add an event listener that will dispatch a custom event to our node
	const handleClick = (event: MouseEvent) => {
		if (node && !node.contains(event.target as Node)) {
			node.dispatchEvent(new CustomEvent("outsideclick")) // Send event to specific element
		}
	}

	document.addEventListener(
		"click",
		handleClick,
		true, // Because you don't want bubbling here, it needs to go *toward* the element
	)

	return {
		destroy: () => {
			document.removeEventListener("click", handleClick, true)
		},
	}
}

// Give a list of keys and call a function for those
export function simpleKeypressHandlerFactory(keys: string[], func: (ev: KeyboardEvent) => void) {
	return (ev: KeyboardEvent) => {
		for (const key of keys) {
			if (key === ev.key) {
				return func(ev)
			}
		}
	}
}

// Give a map where each key is mapped to handler
export function keypressHandlerFactory(map: Map<string, (ev: KeyboardEvent) => void>) {
	return (ev: KeyboardEvent) => {
		const func = map.get(ev.key)
		if (func) {
			func(ev)
		}
	}
}

export function shallowCopyPartialToNotPartial<T extends Object>(src: Partial<T>, dest: T) {
	let key: keyof T
	for (key in src) {
		const value = src[key]
		if (value) dest[key] = value
	}
}
