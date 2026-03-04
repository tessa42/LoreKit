import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase':     ['@supabase/supabase-js'],
        },
      },
    },
  },
  server: {
    // In dev, proxy /api/* to wrangler pages dev (port 8788).
    // Run `npm run dev:cf` in a second terminal to start wrangler.
    proxy: {
      '/api': {
        target: 'http://localhost:8788',
        changeOrigin: true,
      },
    },
  },
})
