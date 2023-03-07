import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
//import ssr from 'vite-plugin-ssr/plugin'

export default defineConfig({
	plugins: [
		sveltekit(),
		//ssr({ disableAutoFullBuild: true }),
	 ],
	build: {
		minify: false,
		reportCompressedSize: false,
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
