import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  optimizeDeps: {
    include: ['@emotion/styled', '@emotion/react'],
  },
  build: {
    minify: mode === 'production',
    sourcemap: mode !== 'production',
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true, // Required for docker
    watch: {
      usePolling: true, // Required for Docker on Windows/Mac
    },
    proxy: {
      '/api': {
        target: 'http://nginx-dev',
        changeOrigin: true,
      },
    },
    hmr: {
      clientPort: 5173,
      host: '127.0.0.1'
    }
  },
}));