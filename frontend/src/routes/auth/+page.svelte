<script lang="ts">
	import { simpleKeypressHandlerFactory } from "$lib/global"
	import { logged_in } from "$stores"
	import { client } from "$clients"
	import {
		PUBLIC_API42_CLIENT_ID,
		PUBLIC_MODE,
		PUBLIC_RANDOM_PHRASE,
		PUBLIC_API42_OAUTH_URI,
		PUBLIC_FRONTEND_URL,
        PUBLIC_DEV_LOGIN
	} from "$env/static/public"
	import { page } from "$app/stores"
	import { goto } from "$app/navigation"
	import { isContractError, zUserName } from "contract"
	import { onMount } from "svelte"

	const checkError: (ret: { status: number; body: any }, what: string) => void = (window as any)
		.checkError
	const makeToast: (message: string) => void = (window as any).makeToast
	let username = ""
	const isProd = PUBLIC_MODE.toLowerCase() === "prod"
	const code = $page.url.searchParams.get("code")
	let ft_uri = new URL(PUBLIC_API42_OAUTH_URI)
	ft_uri.searchParams.append("redirect_uri", new URL("auth", PUBLIC_FRONTEND_URL).toString())
	ft_uri.searchParams.append("client_id", PUBLIC_API42_CLIENT_ID)
	ft_uri.searchParams.append("response_type", "code")
	ft_uri.searchParams.append("scope", "public")
	ft_uri.searchParams.append("state", PUBLIC_RANDOM_PHRASE)
	;(async () => {
		if (code) {
			if ($page.url.searchParams.get("state") === PUBLIC_RANDOM_PHRASE) {
				const ret = await client.auth.login({
					body: {
						redirect_uri: new URL("auth", PUBLIC_FRONTEND_URL).toString(),
						code: $page.url.searchParams.get("code")!,
					},
				})
				if (isContractError(ret) && ret.body.code === "TwoFATokenNeeded") {
					goto("/auth/2fa")
				} else if (ret.status !== 200) {
					if (ret.status === 404) {
						ft_uri.searchParams.set(
							"redirect_uri",
							new URL("/auth/signup", PUBLIC_FRONTEND_URL).toString(),
						)
						window.location.assign(ft_uri)
					}
					checkError(ret, "log in")
				} else {
					makeToast("Logged in successfully")
					logged_in.set(true)
					goto("/")
				}
			} else {
				alert("You are under attack. Close this application as soon as you can")
				throw new Error("You are under attack. Close this application as soon as you can")
			}
		}
	})()

	async function devLogin() {
		const ret = await client.auth.loginDev({
			body: {
				username,
			},
		})
		if (ret.status !== 200) checkError(ret, "log in")
		else {
			makeToast("Logged in successfully")
			logged_in.set(true)
			goto("/")
		}
	}

	let sign_in_42: HTMLAnchorElement
	let dev_input: HTMLInputElement
	onMount(() => dev_input.focus())
</script>

<svelte:window
	on:keydown={simpleKeypressHandlerFactory(["Enter"], () => {
		if (isProd) sign_in_42.click()
	})}
/>

<div class="mt-28 sm:mx-auto sm:w-full sm:max-w-md">
	<div class="rounded-lg bg-gray-50 p-8 sm:px-10">
		<div class="flex justify-around">
			<a
				bind:this={sign_in_42}
				href={ft_uri.toString()}
				class="variant-filled-success btn flex-auto text-lg"
			>
				Sign in with <img
					alt="42"
					src="https://profile.intra.42.fr/assets/42_logo_black-684989d43d629b3c0ff6fd7e1157ee04db9bb7a73fba8ec4e01543d650a1c607.png"
					class="w-8 px-1"
				/>
			</a>
		</div>
	</div>
</div>
{#if isProd == false || PUBLIC_DEV_LOGIN === 'true'}
	<form class="mt-28 sm:mx-auto sm:w-full sm:max-w-md" on:submit|preventDefault={devLogin}>
		<div class="grid grid-rows-2 gap-2 rounded-lg bg-gray-50 p-8 sm:px-10">
			<label class="label text-black" for="username">
				Username
				<input
					bind:this={dev_input}
					bind:value={username}
					type="text"
					name="username"
					class="input"
					autocomplete="on"
					minlength={zUserName.minLength}
					maxlength={zUserName.maxLength}
					required
				/>
			</label>
			<button type="submit" class=" variant-filled-primary btn btn-sm rounded-2xl">
				Get in (will create user if needed)
			</button>
		</div>
	</form>
{/if}

<style>
</style>
