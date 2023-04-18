import { PUBLIC_BACKEND_URL } from "$env/static/public"
import { logged_in } from "$lib/stores"

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
			`GET request to ${PUBLIC_BACKEND_URL + apiEndPoint + params} returned 401`,
			"Logging out...",
			logged_in.set(false),
		)
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
			"Logging out...",
			logged_in.set(false),
		)
	}
	return response
}

export async function login(username: string, password: string) {
	logout()
	const response = fetchPostJSON("/api/auth/login", {
		username,
		password,
	})
	if ((await response).ok) {
		console.log("Login successful")
		logged_in.set(true)
	} else {
		console.log("Login UNsuccessful", "Setting logged in as false")
		logged_in.set(false)
	}
	return response
}

export async function logout() {
	fetchGet("/api/auth/logout")
		.catch(() => deleteCookie("access_token"))
		.finally(() => {
			console.log("Logging out...")
			logged_in.set(false)
		})
}
