import type { LayoutLoad } from "./$types.d"
import { getCookie } from "$lib/global"
import { logged_in } from "$lib/stores"
import { goto } from "$app/navigation"

export const ssr = false

// For all pages, check if user is logged in else redirect to the home/auth page... hopefully
function authGuard() {
	console.log("Checking credentials...")
	if (getCookie("access_token")) {
		console.log("You are logged_in")
		if (window.location.pathname !== "/") {
			goto("/")
		}
	}
	console.log("You are NOT logged_in")
}

export const load = (({}) => {
	// Are we logged yet ?
	if (getCookie("access_token")) logged_in.set(true)
	// authGuard()
}) satisfies LayoutLoad
