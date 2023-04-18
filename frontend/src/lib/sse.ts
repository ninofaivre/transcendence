import { PUBLIC_BACKEND_URL } from "$env/static/public"

export const sse = new EventSource(PUBLIC_BACKEND_URL + "/api/sse")
