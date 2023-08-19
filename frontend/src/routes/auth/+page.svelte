<script lang="ts">
	import { type ToastSettings, toastStore } from "@skeletonlabs/skeleton"
	import { isContractError } from "contract"
	import { checkError, logout, makeToast } from "$lib/global"
	import { logged_in } from "$stores"
	import { client } from "$clients"
	import { PUBLIC_API42_CLIENT_ID, PUBLIC_API42_REDIRECT_URI } from "$env/static/public"
	import { page } from "$app/stores"

	let username = ""
	let password = ""
	let long_random_phrase = "idontunderstandhowyouaresupposedtochoosearandomphrasebutialsodontcare"

	async function formSubmit(e: SubmitEvent) {
		if (e.submitter) {
			if (e.submitter.id === "login") {
				// await logout()
				// const ret = await client.auth.login({
				// 	body: {
				// 		code: $page.url.searchParams.get("code"),
				// 	},
				// })
				// if (ret.status !== 202) checkError(ret, "log in")
				// else { makeToast("Logged in successfully"); logged_in.set(true) }
			} else if (e.submitter.id === "signup") {
				// cons ret = await client.users.signUp({
				// 	body: {
				// 		name: username,
				// 		password,
				// 	},
				// })
				// if (ret.status !== 202) checkError(ret, "log in")
				// else  {makeToast("Logged in successfully") ; logged_in.set(true)}
			}
		}
	}
</script>

<div class="mt-28 sm:mx-auto sm:w-full sm:max-w-md">
	<div class="rounded-lg bg-gray-50 p-8 sm:px-10">
		<!-- <form method="POST" on:submit|preventDefault={formSubmit}> -->
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
			<a
				href={`https://api.intra.42.fr/oauth/authorize?client_id=${PUBLIC_API42_CLIENT_ID}&redirect_uri=${encodeURIComponent(
					PUBLIC_API42_REDIRECT_URI,
				)}&response_type=code&scope=public&state=${long_random_phrase}`}
				id="login"
				class="btn variant-filled-success"
			>
				Log in
			</a>
			<a
				href={`https://api.intra.42.fr/oauth/authorize?client_id=${PUBLIC_API42_CLIENT_ID}&redirect_uri=${encodeURIComponent(
					PUBLIC_API42_REDIRECT_URI + "?username=" + username,
				)}&response_type=code&scope=public&state=${long_random_phrase}`}
				id="signup"
				class="btn variant-filled-primary"
			>
				Sign up
			</a>
		</div>
		<!-- </form> -->
	</div>
</div>

<style>
</style>
