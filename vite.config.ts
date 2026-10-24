import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { apiPlugin } from './server/plugin.ts'

export default defineConfig({
  plugins: [react(), tailwindcss(), apiPlugin()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
})
