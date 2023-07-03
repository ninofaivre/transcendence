<script lang="ts">
	import { type ToastSettings, toastStore } from "@skeletonlabs/skeleton"
	import { login, signup } from "$lib/global"

	let username = ""
	let password = ""

	const signup_failed_toast: ToastSettings = {
		message: "Signup failed",
	}
	const login_failed_toast: ToastSettings = {
		message: "Log in failed",
	}

	async function formSubmit(e: SubmitEvent) {
		if (e.submitter) {
			if (e.submitter.id === "login") {
				const errcode = await login(username, password)
				if (errcode > 400) {
					toastStore.trigger(login_failed_toast)
				}
			} else if (e.submitter.id === "signup") {
				const { status, body } = await signup(username, password)
				if (status > 400) {
					toastStore.trigger(signup_failed_toast)
					console.log(
						`Sign-up failed with code ${status}: `,
						(body as { message?: string })?.message,
					)
				} else console.log(`Signed up ${username}...`)
			} else
				throw new Error(
					`Trying to submit data from unknown submitter with id=${e.submitter.id}`,
				)
		}
	}
</script>

<div class="mt-28 sm:mx-auto sm:w-full sm:max-w-md">
	<div class="rounded-lg bg-gray-50 p-8 sm:px-10">
		<form method="POST" on:submit|preventDefault={formSubmit}>
			<label class="label text-black" for="username"> Username </label>
			<input
				bind:value={username}
				type="text"
				name="username"
				class="input"
				autocomplete="on"
				minlength="3"
			/>
			<label class="label text-black" for="password"> Password </label>
			<input
				bind:value={password}
				type="password"
				name="password"
				class="input"
				autocomplete="current-password"
				required
				minlength="3"
			/>
			<button id="login" type="submit" class="btn variant-filled-success"> Log in </button>
			<button id="signup" type="submit" class="btn variant-filled-primary"> Sign up </button>
		</form>
	</div>
</div>

<style>
</style>
