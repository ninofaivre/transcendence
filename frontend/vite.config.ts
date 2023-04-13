import { sveltekit } from "@sveltejs/kit/vite"
import { defineConfig } from "vitest/config"

export default defineConfig({
	plugins: [sveltekit()],
	build: {
		minify: false,
		reportCompressedSize: false,
	},
	test: {
		include: ["src/**/*.{test,spec}.{js,ts}"],
	},
	server: {
		// https: {
		// 	key: "../secrets/key.pem",
		// 	cert: "../secrets/cert.pem",
		// },
		proxy: {
			// string shorthand: http://localhost:5173/api -> http://localhost:3000/api
			"/api": "http://localhost:3000",
			// with options: http://localhost:5173/api/bar-> http://example.com/bar
			// "/api": {
			// 	target: "http://localhost:3000/api",
			// 	changeOrigin: true,
			// 	secure: true,
			// 	configure: (proxy, _options) => {
			// 		proxy.on("error", (err, _req, _res) => {
			// 			console.log("proxy error", err)
			// 		})
			// 		proxy.on("proxyReq", (_proxyReq, req, _res) => {
			// 			console.log("Sending Request to the Target:", req.method, req.url)
			// 			// console.log(req)
			// 		})
			// 		proxy.on("proxyRes", (proxyRes, req, _res) => {
			// 			console.log(
			// 				"Received Response from the Target:",
			// 				proxyRes.statusCode,
			// 				req.url,
			// 			)
			// 		})
			// 	},
			// },
		},
	},
})
