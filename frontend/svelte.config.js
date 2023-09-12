import adapter from "@sveltejs/adapter-static"
import { vitePreprocess } from "@sveltejs/kit/vite"

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: [vitePreprocess()],
	vitePlugin: {
		inspector: true,
	},
	kit: {
		adapter: adapter({
			fallback: "index.html",
		}),
		alias: {
			$types: "src/lib/types",
			$stores: "src/lib/stores",
			$clients: "src/lib/clients",
			$components: "src/lib/components",
			$modals: "src/lib/components/modals",
		},
		env: {
			dir: "..",
		},
	},
}

export default config
