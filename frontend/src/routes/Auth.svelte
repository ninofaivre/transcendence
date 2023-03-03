<script lang=ts >

	import { getCookie } from '$lib/global'

	export let logged_in = false;

	if (getCookie('access_token'))
		logged_in = true

	let username = '';
	let password = '';

	async function login()
	{
		return await loggedInFetchPostJSON(
					"/auth/login",
					{
						username,
						password
					}
		)
	}

	async function loggedInFetchPostJSON(apiEndPoint, jsBody)
	{
		let body = JSON.stringify(jsBody)
		let headers = {
			"Content-Type": "application/json",
			"Content-Length": toString(body.length),
		}
		return fetch(
						apiEndPoint,
						{
							headers,
							body,
							"method": "POST"
						}
		)
	}

	async function formSubmit(e: SubmitEvent)
	{
		if (e.submitter.id === '0')
		{
			console.log('Logging in...')
			if (!((await login()).ok))
			{
				console.log("Log-in failed")
				return
			}
			else
				logged_in = true;
		}
		else if (e.submitter.id === '1')
		{
			console.log('Registering...')
			loggedInFetchPostJSON(
				"/users/sign-up",
				{
					name: username,
					password: password
				}
			)
		}
		else
			throw new Error(`Trying to submit data from unknown submitter with id=${e.submitter.id}`)
	}
</script>

<form method="POST" on:submit|preventDefault={ formSubmit }>
	<label>
		Username
		<input bind:value={username} type="text" required>
	</label>
	<label>
		Password
		<input bind:value={password} type="password" required>
	</label>
	<button id=0 type=submit>
		Log in
	</button>
	<button id=1 type=submit>
		Register
	</button>
</form>

<style>
</style>
