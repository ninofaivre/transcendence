
export function getCookie(cname: string) {
	const name = cname + "=";
	const ca = document.cookie.split(';');
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

export function deleteCookie( cname: string )
{
  if( getCookie( cname ) )
	  document.cookie = cname + "=" + ";path=/" + ";expires=Thu, 01 Jan 1970 00:00:01 GMT";
}

export async function loggedInFetchPostJSON(apiEndPoint: string, jsBody: Object)
{
    let body = JSON.stringify(jsBody)
    let headers = {
        "Content-Type": "application/json",
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

