import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Version kommt aus Cargo.toml, der Single Source of Truth fürs App-Release (siehe auch --version der Binary).
const cargoToml = readFileSync(fileURLToPath(new URL('../Cargo.toml', import.meta.url)), 'utf-8');
const appVersion = cargoToml.match(/^\s*version\s*=\s*"([^"]+)"/m)?.[1] ?? '0.0.0';

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});