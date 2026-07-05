import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // Strip debug logging from the app (dev + build); real errors still log.
  esbuild: {
    pure: ['console.log', 'console.info', 'console.debug'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://backend:4000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
