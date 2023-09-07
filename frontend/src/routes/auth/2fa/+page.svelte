<script lang="ts">
	import { logged_in } from "$stores"
	import { client } from "$clients"
	import { getToastStore } from "@skeletonlabs/skeleton"
	import { goto } from "$app/navigation"
	import { isContractError } from "contract"

	const toastStore = getToastStore()
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
	function makeToast(message: string) {
		if (toastStore)
			toastStore.trigger({
				message,
			})
	}
	function checkError(ret: { status: number; body: any }, what: string) {
		if (isContractError(ret)) {
			makeToast("Could not " + what + " : " + ret.body.message)
			console.log(ret.body.code)
		} else {
			let msg = "Server return unexpected status " + ret.status
			if ("message" in ret.body) msg += " with message " + ret.body.message
			makeToast(msg)
			console.error(msg)
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
				minlength="3"
			/>
		</label>
		<button on:click={login2FA} class="variant-filled-primary btn btn-sm rounded-2xl">
			<div>Send confirmation code</div>
		</button>
	</div>
</div>
