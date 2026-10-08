import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// base './' lets the build run from any folder on a static host.
export default defineConfig({ base: './', plugins: [svelte()] });
