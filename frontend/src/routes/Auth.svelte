<script lang="ts">
	import { type ToastSettings, toastStore } from "@skeletonlabs/skeleton"
	import { getCookie, fetchPostJSON } from "$lib/global"

	export let logged_in = false

	if (getCookie("access_token")) logged_in = true

	let username = ""
	let password = ""

	async function login() {
		return fetchPostJSON("/api/auth/login", {
			username,
			password
		})
	}

	async function signup() {
		return fetchPostJSON("/api/user/sign-up", {
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
			if (e.submitter.id === "login") {
				console.log(`${username} is logging in...`)
				if (!(await login()).ok) {
					console.log("Log-in failed")
					toastStore.trigger(login_failed_toast)
					return
				} else logged_in = true
			} else if (e.submitter.id === "signup") {
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

<div class="mt-28 sm:mx-auto sm:w-full sm:max-w-md">
	<div class="rounded-lg bg-gray-50 p-8 sm:px-10">
		<form method="POST" on:submit|preventDefault={formSubmit}>
			<label class="label text-black">
				Username
				<input bind:value={username} type="text" required class="input" />
				<label class="label text-black">
					Password
					<input bind:value={password} type="password" required class="input" />
				</label>
				<button id="login" type="submit" class="btn variant-filled-success"> Log in </button>
				<button id="signup" type="submit" class="btn variant-filled-primary"> Sign up </button>
			</label>
		</form>
	</div>
</div>

<style>
</style>
