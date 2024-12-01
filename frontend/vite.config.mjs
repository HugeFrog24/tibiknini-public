import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  optimizeDeps: {
    include: ['@emotion/styled', '@emotion/react'],
    force: true,
  },
  build: {
    minify: mode === 'production',
    sourcemap: mode !== 'production',
    chunkSizeWarningLimit: 1600,
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true, // Required for docker
    watch: {
      usePolling: true, // Required for Docker on Windows/Mac
      interval: 1000,
      batchSize: 50  // Add batch size to limit concurrent file operations
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