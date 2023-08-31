import { sveltekit } from "@sveltejs/kit/vite"
import { defineConfig, loadEnv } from "vite"
import { purgeCss } from "vite-plugin-tailwind-purgecss"

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, "..")
	return {
		ssr: {
			noExternal: ["three"],
		},
		plugins: [sveltekit(), purgeCss()],
		build: {
			minify: false,
		},
		envDir: "../",
		server: {
			// https: {
			// 	key: "../secrets/key.pem",
			// 	cert: "../secrets/cert.pem",
			// },
			proxy: {
				// string shorthand: http://localhost:5173/api -> http://localhost:3000/api
				"/api": env.PUBLIC_BACKEND_URL,
				// Proxying websockets or socket.io: ws://localhost:5173/socket.io -> ws://localhost:3000/socket.io
				// "/": {
				// 	target: "ws://localhost:3000",
				// 	ws: true,
				// },
			},
		},
	}
})
