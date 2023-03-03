import { getCookie, logedInFetchPostJSON } from './global.js'

if (getCookie('access_token'))
	window.location.href = '/home.html'

window.loginFormSubmit = async function ()
{
	if (!((await login()).ok))
	{
		console.log("login failed")
		return
	}
	window.location.href = '/test.html'

}

window.registerFormSubmit = async function ()
{
	logedInFetchPostJSON("/users/sign-up", { name: document.forms["register"]["username"].value, password: document.forms["register"]["password"].value })
}

async function login()
{
	return (await logedInFetchPostJSON("/auth/login", { username: document.forms["login"]["username"].value, password: document.forms["login"]["password"].value }))
}
