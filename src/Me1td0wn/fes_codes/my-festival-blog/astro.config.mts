import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
	site: 'https://github.com/Me1td0wn76/ocs_festival',
	base: 'astro-photography-portfolio',
	vite: {
		plugins: [tailwindcss()],
	},
});
