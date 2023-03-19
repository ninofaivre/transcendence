import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
<<<<<<< HEAD
    plugins: [
        sveltekit(),
    ],
    build: {
        minify: false,
        reportCompressedSize: false,
    },
    test: {
        include: ['src/**/*.{test,spec}.{js,ts}']
    },
    server: {
        https: {
            key: "../secrets/key.pem",
            cert: "../secrets/cert.pem",
        }
    }
=======
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
	},
	server: {
		https:
		{
			key: '../secrets/key.pem',
			cert: '../secrets/cert.pem',
		}
	}
>>>>>>> 93997c20 (kfjskldj)
});
