<script lang="ts">
	import { checkError, makeToast } from "$lib/global"
	import { logged_in } from "$stores"
	import { client } from "$clients"
	import { PUBLIC_RANDOM_PHRASE, PUBLIC_FRONTEND_URL } from "$env/static/public"
	import { page } from "$app/stores"
	import { goto } from "$app/navigation"

	let username = ""
	const code = $page.url.searchParams.get("code") ?? ""
	const state = $page.url.searchParams.get("state")
	if (!code) {
		alert(
			"Sorry. Something went wrong in the signup process: Auth code is missing from the query string",
		)
		goto("/")
	}
	if (state !== PUBLIC_RANDOM_PHRASE) {
		alert("You are under attack. Leave and never come back.")
		goto("/")
	}

	async function signUp() {
		const ret = await client.users.signUp({
			body: {
				username,
				redirect_uri: new URL("/auth/signup", PUBLIC_FRONTEND_URL).toString(),
				code,
			},
		})
		if (ret.status !== 201) {
			checkError(ret, "sign up")
		} else {
			makeToast("Successfully signed up")
			logged_in.set(true)
			const ret = await client.users.getMe()
			if (ret.status === 200) {
				goto("/users/" + ret.body.userName)
			} else {
				console.log(ret)
				goto("/")
			}
		}
	}
</script>

<div class="mt-28 sm:mx-auto sm:w-full sm:max-w-md">
	<div class="grid grid-rows-2 gap-2 rounded-lg bg-gray-50 p-8 sm:px-10">
		<label class="label text-black" for="username">
			Username
			<input
				bind:value={username}
				type="text"
				name="username"
				class="input"
				autocomplete="on"
				minlength="3"
			/>
		</label>
		<button on:click={signUp} class="btn btn-sm variant-filled-primary rounded-2xl">
			<div>Confirm</div>
		</button>
	</div>
</div>
