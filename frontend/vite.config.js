import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// docs/desain-v2.md B12.1. Dev + preview proxy /api to the local Laravel server (php artisan serve).
const apiProxy = { '/api': 'http://127.0.0.1:8000' };

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, proxy: apiProxy },
  preview: { port: 4173, proxy: apiProxy },
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
});
