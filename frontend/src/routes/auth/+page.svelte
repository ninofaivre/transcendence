<script lang="ts">
	import { type ToastSettings, toastStore } from "@skeletonlabs/skeleton"
	import { isContractError } from "contract"
	import { logout, makeToast } from "$lib/global"
	import { logged_in } from "$stores"
	import { client } from "$clients"

	let username = ""
	let password = ""

	async function formSubmit(e: SubmitEvent) {
		if (e.submitter) {
			if (e.submitter.id === "login") {
				await logout()
				const login_ret = await client.auth.login({
					body: {
						username,
						password,
					},
				})
				if (login_ret.status === 202) {
					makeToast("Login successful")
					logged_in.set(true)
				} else if (isContractError(login_ret)) {
					makeToast("Login UNsuccessful: $ Server returned:" + login_ret.status)
				} else throw new Error("Unexpected return from server:" + login_ret.status)
			} else if (e.submitter.id === "signup") {
				const signup_ret = await client.users.signUp({
					body: {
						name: username,
						password,
					},
				})
				if (signup_ret.status === 201) {
					makeToast("Succesfully signed up " + username)
				} else if (isContractError(signup_ret.status)) {
					makeToast("Sign-up failed with code: " + signup_ret.status)
				}
			}
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
				class="input mb-3"
				autocomplete="current-password"
				required
				minlength="3"
			/>
			<div class="flex justify-around">
				<button id="login" type="submit" class="btn variant-filled-success">
					Log in
				</button>
				<button id="signup" type="submit" class="btn variant-filled-primary">
					Sign up
				</button>
			</div>
		</form>
	</div>
</div>

<style>
</style>
