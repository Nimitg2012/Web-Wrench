import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { apiPlugin } from './server/plugin.ts'

function pagesSpaFallback(): Plugin {
  return {
    name: 'pages-spa-fallback',
    apply: 'build',
    writeBundle(options) {
      if (!options.dir) return
      copyFileSync(resolve(options.dir, 'index.html'), resolve(options.dir, '404.html'))
    },
  }
}

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/Web-Wrench/' : '/',
  plugins: [react(), tailwindcss(), apiPlugin(), pagesSpaFallback()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
}))
