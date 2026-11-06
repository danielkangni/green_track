import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    // Three.js est chargé à la demande (vue « Maquette 3D » uniquement)
    chunkSizeWarningLimit: 700,
  },
  server: { host: true },
});
