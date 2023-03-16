<script lang=ts >

	import { getCookie } from '$lib/global'

	export let logged_in = false;

	if (getCookie('access_token'))
		logged_in = true

	let username = '';
	let password = '';
	let login_failed = false;
	let signup_failed = false;

	async function login()
	{
		return loggedInFetchPostJSON(
					"/auth/login",
					{
						username,
						password
					},
		)
	}

	async function signup()
	{
		return loggedInFetchPostJSON(
				"/users/sign-up",
				{
					name: username,
					password,
				},
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
							method: "POST"
						}
		)
	}

	async function formSubmit(e: SubmitEvent)
	{
		if (e.submitter.id === '0')
		{
			console.log(`${username} is logging in...`)
			if ( !( ( await login() ).ok ) )
			{
				console.log("Log-in failed")
				signup_failed = true
				return
			}
			else
				logged_in = true;
		}
		else if (e.submitter.id === '1')
		{
			if ( !( ( await signup() ).ok ) )
			{
				console.log("Sign-up failed")
				return
			}
			console.log(`Signing up ${username}...`)
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
		Sign up
	</button>
</form>


{#if signup_failed}
	<p> Sign up failed</p>
{/if}

{#if login_failed}
	<p> Log in failed</p>
{/if}

<style>
</style>
