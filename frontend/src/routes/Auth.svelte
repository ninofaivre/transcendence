<script lang="ts">
	import type { ToastSettings } from "@skeletonlabs/skeleton"

	import { Toast, toastStore } from "@skeletonlabs/skeleton"
	import { getCookie, fetchPostJSON } from "$lib/global"

	export let logged_in = false

	if (getCookie("access_token")) logged_in = true

	let username = ""
	let password = ""

	async function login() {
		return fetchPostJSON("/auth/login", {
			username,
			password
		})
	}

	async function signup() {
		return fetchPostJSON("/users/sign-up", {
			name: username,
			password
		})
	}

	const signup_failed_toast: ToastSettings = {
		message: "Signup failed"
	}
	const login_failed_toast: ToastSettings = {
		message: "Log in failed"
	}
	async function formSubmit(e: SubmitEvent) {
		if (e.submitter) {
			if (e.submitter.id === "0") {
				console.log(`${username} is logging in...`)
				if (!(await login()).ok) {
					console.log("Log-in failed")
					toastStore.trigger(login_failed_toast)
					return
				} else logged_in = true
			} else if (e.submitter.id === "1") {
				if (!(await signup()).ok) {
					toastStore.trigger(signup_failed_toast)
					console.log("Sign-up failed")
					return
				}
				console.log(`Signing up ${username}...`)
			} else
				throw new Error(`Trying to submit data from unknown submitter with id=${e.submitter.id}`)
		}
	}
</script>

<div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
	<div class="rounded-lg bg-white py-8 px-6 sm:px-10">
		<form method="POST" on:submit|preventDefault={formSubmit}>
			<label class="label">
				Username
				<input bind:value={username} type="text" required class="input" />
				<label class="label">
					Password
					<input bind:value={password} type="password" required class="input" />
				</label>
				<button id="0" type="submit" class="btn variant-filled"> Log in </button>
				<button id="1" type="submit" class="btn variant-filled"> Sign up </button>
			</label>
		</form>
	</div>
</div>

<style>
</style>
