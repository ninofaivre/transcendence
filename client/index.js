import { getCookie, logedInFetchPostJSON } from './global.js'

if (getCookie('access_token'))
	window.location.href = '/home.html'

window.loginFormSubmit = async function ()
{
	let accessToken = (await login()).access_token
	if (accessToken)
		document.cookie = `access_token=${accessToken}; path=/;`
	console.log('access token :', accessToken)
	if (accessToken)
		window.location.href = '/test.html'
	else
		console.log("failed to log")
}

window.registerFormSubmit = async function ()
{
	logedInFetchPostJSON("/users/sign-up", { name: document.forms["register"]["username"].value, password: document.forms["register"]["password"].value })
}

async function login()
{
	return (await logedInFetchPostJSON("/auth/login", { username: document.forms["login"]["username"].value, password: document.forms["login"]["password"].value })).json()
}
