<script lang="ts">
	import { checkError, makeToast } from "$lib/global"
	import { logged_in } from "$stores"
	import { client } from "$clients"
	import { PUBLIC_RANDOM_PHRASE, PUBLIC_FRONTEND_URL, PUBLIC_API42_OAUTH_URI, PUBLIC_API42_CLIENT_ID  } from "$env/static/public"
	import { page } from "$app/stores"
	import { goto } from "$app/navigation"
	import { getToastStore } from "@skeletonlabs/skeleton"


	let ft_uri = new URL(PUBLIC_API42_OAUTH_URI)
	ft_uri.searchParams.append("client_id", PUBLIC_API42_CLIENT_ID)
	ft_uri.searchParams.append("response_type", "code")
	ft_uri.searchParams.append("scope", "public")
	ft_uri.searchParams.append("state", PUBLIC_RANDOM_PHRASE)

    const redirect_uri = new URL("/auth/signup", PUBLIC_FRONTEND_URL)
    ft_uri.searchParams.set(
        "redirect_uri",
        redirect_uri.toString()
    )


	const toastStore = getToastStore()
	let displayName = ""
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

    const retry = $page.url.searchParams.get("retry")
    if (retry)
    {
        redirect_uri.searchParams.set("retry", "true")
        ft_uri.searchParams.set(
            "redirect_uri",
            redirect_uri.toString()
        )
    }

	async function signUp() {
		const ret = await client.users.signUp({
			body: {
                displayName,
				redirect_uri: redirect_uri.toString(),
				code,
			},
		})
		if (ret.status !== 201) {
            if (ret.status === 409) {
                redirect_uri.searchParams.set("retry", "true")
                ft_uri.searchParams.set(
                    "redirect_uri",
                    redirect_uri.toString()
                )
                window.location.assign(ft_uri)
            }
            else if (ret.status === 403) {
                goto("/auth")
            }
			checkError(ret, "sign up", toastStore)
		} else {
			makeToast("Successfully signed up", toastStore)
			logged_in.set(true)
			const ret = await client.users.getMe()
			if (ret.status === 200) {
				goto("/myprofile")
			} else {
				console.log(ret)
				goto("/")
			}
		}
	}
</script>

<div class="mt-28 sm:mx-auto sm:w-full sm:max-w-md">
	<div class="grid grid-rows-2 gap-1 rounded-lg bg-gray-50 p-3 sm:px-10">
		<label class="label text-black" for="username">
			Username
		</label>
        <input
            id="username"
            bind:value={displayName}
            type="text"
            name="username"
            class="input"
            autocomplete="on"
            minlength="3"
        />
        {#if $page.url.searchParams.get("retry")}
            <sub class="text-red-500 p-1">
                This user is already taken
            </sub>
        {/if}
		<button on:click={signUp} class="py-2 variant-filled-primary btn btn-sm rounded-2xl">
			<div>Confirm</div>
		</button>
	</div>
</div>
