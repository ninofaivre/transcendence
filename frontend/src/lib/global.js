import { PUBLIC_BACKEND_URL } from '$env/static/public';
export function getCookie(cname) {
    const name = cname + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
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
export function deleteCookie(cname) {
    if (getCookie(cname))
        document.cookie = cname + "=" + ";path=/" + ";expires=Thu, 01 Jan 1970 00:00:01 GMT";
}
export async function fetchPostJSON(apiEndPoint, jsBody) {
    let body = JSON.stringify(jsBody);
    let headers = {
        "Content-Type": "application/json",
    };
    return fetch(PUBLIC_BACKEND_URL + apiEndPoint, {
        headers,
        body,
        method: "POST"
    });
}
//# sourceMappingURL=global.js.map