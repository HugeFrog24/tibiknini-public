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
}));