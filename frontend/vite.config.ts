import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
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
});
