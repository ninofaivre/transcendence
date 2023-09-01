<script lang="ts">
	import { checkError, makeToast } from "$lib/global"
	import { logged_in } from "$stores"
	import { client } from "$clients"
    import { getToastStore } from "@skeletonlabs/skeleton";

    const toastStore = getToastStore()
	let input = ""

	async function login2FA() {
        const ret = await client.auth.login2FA({
            body: {
                twoFAtoken: input,
            }
        })
        if (ret.status !== 200) checkError(ret, "confirm log in", getToastStore())
        else {
            logged_in.set(true)
            makeToast("Logged in successfully", toastStore)
        }
	}
</script>

<div class="mt-28 sm:mx-auto sm:w-full sm:max-w-md">
	<div class="grid grid-rows-2 gap-2 rounded-lg bg-gray-50 p-8 sm:px-10">
		<label class="label text-black" for="username">
			Username
			<input
				bind:value={input}
				type="text"
				name="username"
				class="input"
				autocomplete="on"
				minlength="3"
			/>
		</label>
		<button on:click={login2FA} class="btn btn-sm variant-filled-primary rounded-2xl">
			<div>Send confirmation code</div>
		</button>
	</div>
</div>
