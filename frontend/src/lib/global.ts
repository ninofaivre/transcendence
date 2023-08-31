import type { SseEvent } from "contract"

import { PUBLIC_BACKEND_URL } from "$env/static/public"
import { logged_in } from "$lib/stores"
import { client } from "$clients"
import { isContractError } from "contract"
import { getToastStore } from "@skeletonlabs/skeleton"

const toastStore = getToastStore()

export function checkError(ret: { status: number; body: any }, what: string) {
	if (isContractError(ret)) {
		makeToast("Could not " + what + " : " + ret.body.message)
		console.log(ret.body.code)
	} else {
		let msg = "Server return unexpected status " + ret.status
		if ("message" in ret.body) msg += " with message " + ret.body.message
		makeToast(msg)
		console.error(msg)
	}
}

export function getCookie(cname: string) {
	const name = cname + "="
	const ca = document.cookie.split(";")
	for (let i = 0; i < ca.length; i++) {
		let c = ca[i]
		while (c.charAt(0) == " ") {
			c = c.substring(1)
		}
		if (c.indexOf(name) == 0) {
			return c.substring(name.length, c.length)
		}
	}
	return ""
}

export function deleteCookie(cname: string) {
	if (getCookie(cname))
		document.cookie = cname + "=" + ";path=/" + ";expires=Thu, 01 Jan 1970 00:00:01 GMT"
}

export async function fetchGet(apiEndPoint: string, urlArgs?: object) {
	let params = ""
	if (urlArgs) {
		params =
			"?" +
			Object.entries(urlArgs)
				.map(([k, v]) => `${k}=${v}`)
				.join("&")
	}
	const response = await fetch(PUBLIC_BACKEND_URL + apiEndPoint + params, {
		// mode: "cors",
		credentials: "include",
	})
	if (response.status == 401) {
		console.log(
			`GET request to ${
				PUBLIC_BACKEND_URL + apiEndPoint + params
			} returned 401 although we are logged in ! : Logging us out...`,
		)
		logged_in.set(false)
	}
	return response
}

export async function fetchPostJSON(apiEndPoint: string, jsBody: object, urlArgs?: object) {
	let params = ""
	if (urlArgs)
		params =
			"?" +
			Object.entries(urlArgs)
				.map(([k, v]) => `${k}=${v}`)
				.join("&")
	let body = JSON.stringify(jsBody)
	let headers = {
		"Content-Type": "application/json",
	}
	const response = await fetch(PUBLIC_BACKEND_URL + apiEndPoint + params, {
		// mode: "cors",
		credentials: "include",
		method: "POST",
		headers,
		body,
	})
	if (response.status == 401) {
		console.log(
			`POST request to ${PUBLIC_BACKEND_URL + apiEndPoint} returned 401`,
			"Logging out after unauthorized request...",
			logged_in.set(false),
		)
	}
	return response
}

export async function logout() {
	return client.auth
		.logout()
		.catch(({ status, message }) => {
			makeToast(
				`Can't log out. Server returned ${status} ${
					message ? "without a message" : `${message}`
				}`,
			)
		})
		.then(() => {
			makeToast("Logging out...")
		})
		.finally(() => {
			logged_in.set(false)
		})
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
	console.log("Adding event listener to EventSource for ", eventType)
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
			node.removeEventListener("click", handleClick, true)
		},
	}
}

export function reportUnexpectedCode(
	code: Number,
	what: string,
	ret: any,
	level?: "error" | "warning" | "log",
) {
	const message = ret?.message
		? `Could not ${what}. Server returned ${code}\n with message \"${ret?.message}\"`
		: `Could not ${what}. Server returned ${code}\n with the following data: ${JSON.stringify(
				ret,
		  )}`
	switch (level) {
		case "log":
			console.log(message)
			break
		case "warning":
			console.warn(message)
			break
		case "error":
			console.error(message)
			break
		default:
			console.log(message)
	}
	return message
}

export function makeToast(message: string) {
	toastStore.trigger({
		message,
	})
	return message
}

// Give a list of keys and call a function for those
export function simpleKeypressHandlerFactory(keys: string[], func: (ev?: KeyboardEvent) => void) {
	return (ev: KeyboardEvent) => {
		for (const key of keys) {
			if (key === ev.key) {
				return func(ev)
			}
		}
	}
}

// Give a map where each key is mapped to handler
export function keypressHandlerFactory(map: Map<string, (ev?: KeyboardEvent) => void>) {
	return (ev: KeyboardEvent) => {
		const func = map.get(ev.key)
		if (func) {
			func(ev)
		}
	}
}

export function bs_hash(str: string) {
	let sum = 0
	for (let char of str) {
		sum += char.charCodeAt(0) - 98
	}
	sum = sum % 70
	return String(sum)
}

export function shallowCopyPartialToNotPartial<T extends Object>(src: Partial<T>, dest: T) {
	let key: keyof T
	for (key in src) {
		const value = src[key]
		if (value) dest[key] = value
	}
}
