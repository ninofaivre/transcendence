import { PUBLIC_BACKEND_URL } from "$env/static/public"
import { logged_in } from "$lib/stores"
import { authClient, usersClient } from "$clients"
import type { SseEvent } from "contract"
import { toastStore } from "@skeletonlabs/skeleton"

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

export async function login(username: string, password: string) {
	await logout()
	const { status } = await authClient.login({
		body: {
			username,
			password,
		},
	})
	if (status < 400) {
		console.log("Login successful")
		logged_in.set(true)
	} else {
		console.log("Login UNsuccessful. Server returned:", status)
	}
	return status
}

export async function logout() {
	return authClient
		.logout()
		.catch(({ status, message }) => {
			console.warn(
				`Can't log out. Server returned ${status} ${
					message ? "without a message" : `${message}`
				}`,
			)
		})
		.then((result) => {
			console.log("Logging out...")
			logged_in.set(false)
			return result
		})
}

export async function signup(name: string, password: string) {
	return usersClient.signUp({
		body: {
			name,
			password,
		},
	})
}

type GetDataFromEventType<T extends SseEvent["type"]> = Extract<SseEvent, { type: T }>["data"]

export function addEventSourceListener<EventType extends SseEvent["type"]>(
	es: EventSource,
	eventType: EventType,
	callback: (data: GetDataFromEventType<EventType>, event: MessageEvent) => void,
) {
	es.addEventListener(eventType, (ev: MessageEvent) => {
		console.log("Adding event listener...")
		callback(JSON.parse(ev.data), ev)
	})
}

export function toastMessage(message: string) {
    toastStore.trigger({
        message
    })
}

