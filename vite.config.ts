import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/parermaster2/',
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: [
      '7671-2400-2653-e922-6f00-e009-f5da-904c-db66.ngrok-free.app',
      '0b2e-2400-2653-e922-6f00-48f0-653e-f3f5-ba8.ngrok-free.app',
    ],
  },
})
