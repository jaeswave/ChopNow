import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    // Run tests on Lagos time so date output is the same on every computer and in CI
    env: { TZ: 'Africa/Lagos' },
  },
});
