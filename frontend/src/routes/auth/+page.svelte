<script lang="ts">
	import { checkError, logout, makeToast } from "$lib/global"
	import { logged_in } from "$stores"
	import { client } from "$clients"
	import {
		PUBLIC_API42_CLIENT_ID,
		PUBLIC_API42_REDIRECT_URI,
		PUBLIC_MODE,
		PUBLIC_RANDOM_PHRASE,
	} from "$env/static/public"
	import { page } from "$app/stores"
	import { goto } from "$app/navigation"

	let username = ""
	const isProd = PUBLIC_MODE.toLowerCase() === "prod"
	const code = $page.url.searchParams.get("code")

	;(async () => {
		if (code) {
			if ($page.url.searchParams.get("state") === PUBLIC_RANDOM_PHRASE) {
				const ret = await client.auth.login({
					body: {
						code: $page.url.searchParams.get("code")!,
					},
				})
				if (ret.status !== 200) {
					if (ret.status === 404) {
						alert("/auth/signup?" + $page.url.searchParams.toString())
						goto("/auth/signup?" + $page.url.searchParams.toString())
					}
					checkError(ret, "log in")
				} else {
					makeToast("Logged in successfully")
					logged_in.set(true)
				}
			} else {
				alert("You are under attack. Close this application as soon as you can")
				throw new Error("You are under attack. Close this application as soon as you can")
			}
		}
	})()

	async function devLogin() {
		await logout()
		const ret = await client.auth.loginDev({
			body: {
				username,
			},
		})
		if (ret.status !== 200) checkError(ret, "log in")
		else {
			makeToast("Logged in successfully")
			logged_in.set(true)
		}
	}
</script>

<div class="mt-28 sm:mx-auto sm:w-full sm:max-w-md">
	<div class="rounded-lg bg-gray-50 p-8 sm:px-10">
		<div class="flex justify-around">
			<a
				href={`https://api.intra.42.fr/oauth/authorize?client_id=${PUBLIC_API42_CLIENT_ID}&redirect_uri=${encodeURIComponent(
					PUBLIC_API42_REDIRECT_URI,
				)}&response_type=code&scope=public&state=${PUBLIC_RANDOM_PHRASE}`}
				class="btn variant-filled-success flex-auto"
			>
				Sign in with 42
			</a>
		</div>
	</div>
</div>
{#if isProd == false}
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
			<button
				on:click={devLogin}
				class="btn btn-sm variant-filled-primary grid grid-rows-2 rounded-2xl"
			>
				<div>Get in with username</div>
				<small>Create it if it does not exist</small>
			</button>
		</div>
	</div>
{/if}

<style>
</style>
