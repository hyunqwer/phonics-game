import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    // Honor a harness-assigned port (preview autoPort sets PORT); fall back to Vite's default.
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
  },
});
