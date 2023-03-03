export function getCookie(cname) {
	let name = cname + "=";
	let ca = document.cookie.split(';');
	for(let i = 0; i < ca.length; i++) {
		let c = ca[i];
		while (c.charAt(0) == ' ') {
			c = c.substring(1);
		}
		if (c.indexOf(name) == 0) {
			return c.substring(name.length, c.length);
		}
	}
	return "";
}

export async function logedInFetchGetNoInfo(apiEndPoint)
{
	return (await fetch(apiEndPoint,
		{
			"method": "GET",
		}))
		.json()
}

export async function logedInFetchPostJSON(apiEndPoint, jsBody)
{
	let header = { "Content-Type": "application/json" }
	let body = JSON.stringify(jsBody)
	header["Content-Length"] = toString(body.length)
	return fetch(apiEndPoint,
		{
			"headers": header,
			"body": body,
			"method": "POST"
		})
}
