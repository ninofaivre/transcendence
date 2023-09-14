<script lang="ts">
	import { logged_in } from "$stores"
	import { client } from "$clients"
	import { getToastStore } from "@skeletonlabs/skeleton"
	import { goto } from "$app/navigation"

	const checkError: (ret: { status: number; body: any }, what: string) => void = (window as any)
		.checkError
	const makeToast: (message: string) => void = (window as any).makeToast
	let input = ""

	async function login2FA() {
		const ret = await client.auth.twoFAauth({
			body: {
				twoFAtoken: input,
			},
		})
		if (ret.status !== 200) checkError(ret, "confirm log in")
		else {
			logged_in.set(true)
			makeToast("Logged in successfully")
			goto("/")
		}
	}
</script>

<div class="mt-28 sm:mx-auto sm:w-full sm:max-w-md">
	<div class="grid grid-rows-2 gap-2 rounded-lg bg-gray-50 p-8 sm:px-10">
		<label class="label text-black" for="username">
			2FA code
			<input
				bind:value={input}
				type="text"
				name="username"
				class="input"
				autocomplete="on"
                minlength={6}
                maxlength={6}
			/>
		</label>
		<button on:click={login2FA} class="variant-filled-primary btn btn-sm rounded-2xl">
			<div>Send confirmation code</div>
		</button>
	</div>
</div>
