import { PUBLIC_BACKEND_URL } from "$env/static/public"

// export const sse = new EventSource("http:localhost:3000/api/sse", { withCredentials: true })
export const sse = new EventSource(PUBLIC_BACKEND_URL + "/api/sse")
