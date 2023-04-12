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

export async function fetchGet(apiEndPoint: string) {
	return fetch(PUBLIC_BACKEND_URL + apiEndPoint, {
		mode: "cors",
		credentials: "include",
	})
}

export async function fetchPostJSON(apiEndPoint: string, jsBody: Object) {
	let body = JSON.stringify(jsBody)
	let headers = {
		"Content-Type": "application/json",
	}
	return fetch(PUBLIC_BACKEND_URL + apiEndPoint, {
		mode: "cors",
		credentials: "include",
		method: "POST",
		headers,
		body,
	})
}

export async function logout() {
	fetchGet("/api/auth/logout")
		.then(() => logged_in.set(false))
		.catch(() => deleteCookie("access_token"))
}

// Unused for now. There to serve as an example of an use:directive
// This function is called when the element is mounted by svelte's `use:` directive
export function clickOutside(node: Node) {
	// Create a handler
	const handleClick = (event: MouseEvent) => {
		if (!node.contains(event.target as Node)) {
			node.dispatchEvent(new CustomEvent("outclick"))
		}
	}
	// Add handler to the whole page
	document.addEventListener("click", handleClick, true)

	return {
		destroy() {
			document.removeEventListener("click", handleClick, true)
		},
	}
}
