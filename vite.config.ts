import build from '@hono/vite-build/cloudflare-pages'
import devServer from '@hono/vite-dev-server'
import adapter from '@hono/vite-dev-server/cloudflare'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => {
  if (mode === 'client') {
    return {
      plugins: [react(), tailwindcss()],
      build: {
        copyPublicDir: false,
        rollupOptions: {
          input: './src/frontend/main.tsx',
          output: {
            dir: './dist/static',
            entryFileNames: 'client.js',
            assetFileNames: 'client.[ext]'
          }
        }
      }
    }
  }

  return {
    plugins: [
      build(),
      devServer({
        adapter,
        entry: 'src/index.tsx'
      })
    ]
  }
})
