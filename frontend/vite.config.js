import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': { target: process.env.BWEB_API_TARGET || 'http://127.0.0.1:8080', changeOrigin: true },
    },
  },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
  build: {
    target: 'es2022',
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/pixi.js') || id.includes('node_modules/@pixi')) return 'pixi';
          if (id.includes('node_modules/gsap')) return 'gsap';
        },
      },
    },
  },
});
